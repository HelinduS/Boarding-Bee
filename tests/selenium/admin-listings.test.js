const { Builder, By, until } = require('selenium-webdriver');
const { getChromeOptions } = require('./seleniumTestUtils');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';
const assert = require('assert');

async function registerUser(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return res;
}

async function loginUser(identifier, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ identifier, password }) });
  return res.json();
}

async function createListing(token, payload) {
  const res = await fetch(`${API_URL}/api/listings/json`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { throw new Error(`createListing: invalid JSON response (status ${res.status}): ${text}`); }
  return json;
}

async function deleteListing(token, id) {
  // DELETE /api/listings/{id} requires owner token
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    return res;
  } catch (e) {
    // swallow - cleanup should best-effort
    return null;
  }
}

describe('Admin moderation E2E', function() {
  this.timeout(120000); // Increased timeout to 2 minutes

  it('admin can approve a pending listing and perform bulk/reject flows', async function() {
    const owner = { username: `e2e_owner_${Date.now()}`, email: `e2e_owner_${Date.now()}@example.com`, password: 'TestPass123!', firstName: 'Owner', lastName: 'E2E', userType: 'owner', role: 'OWNER' };
    const admin = { username: `e2e_admin_${Date.now()}`, email: `e2e_admin_${Date.now()}@example.com`, password: 'AdminPass123!', firstName: 'Admin', lastName: 'E2E', userType: 'admin', role: 'ADMIN' };

  // track created listings so we can clean them up after the test
  const createdListings = [];

  // create owner and assert registration success
  const regOwnerRes = await registerUser({ ...owner, phoneNumber: '1234567890', permanentAddress: 'addr', gender: 'other', emergencyContact: '0987654321', institutionCompany: '', location: '' });
  assert(regOwnerRes.ok, `owner register failed: ${regOwnerRes.status}`);
  const ownerLogin = await loginUser(owner.email, owner.password);
  assert(ownerLogin && ownerLogin.token, 'owner login did not return token');
  const ownerToken = ownerLogin.token;

    // create pending listing via API
    const title = 'E2E Admin Listing ' + Date.now();
    const listingPayload = { title, location: 'Test City', price: 10.0, description: 'E2E listing for moderation test' };
  const createRes = await createListing(ownerToken, listingPayload);
  console.log('Created first listing:', createRes);
  assert(createRes.listingId, 'listingId should be returned');
  const listingId = createRes.listingId;
  createdListings.push(listingId);

  // create admin user and assert
  const regAdminRes = await registerUser({ ...admin, phoneNumber: '111222333', permanentAddress: 'admin addr', gender: 'other', emergencyContact: '111222333', institutionCompany: '', location: '' });
  assert(regAdminRes.ok, `admin register failed: ${regAdminRes.status}`);

    // Start selenium and login as admin via UI
    const options = getChromeOptions('admin-moderation');
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
      // go to login page
      await driver.get(`${BASE_URL}/login`);
      await driver.wait(until.elementLocated(By.css('input#identifier')), 15000);
      await driver.findElement(By.css('input#identifier')).clear();
      await driver.findElement(By.css('input#identifier')).sendKeys(admin.email);
      await driver.findElement(By.css('input#password')).sendKeys(admin.password);
      await driver.findElement(By.css('button[type="submit"]')).click();

  // wait for redirect to admin dashboard
  await driver.wait(until.urlContains('/admin-dashboard'), 15000);

  // Set prompt override as early as possible
  await driver.executeScript('window.prompt = function(){ return "Not acceptable"; };');

  await driver.get(`${BASE_URL}/admin-dashboard`);

  // Gives you 30 seconds to inspect the UI
  await driver.sleep(30000);

  // Add debug output here
const allCards = await driver.findElements(By.css('[data-testid^="listing-card-"]'));
console.log('Found listing cards:', allCards.length);
for (const card of allCards) {
  const html = await card.getAttribute('outerHTML');
  console.log(html);
}


          // wait for moderation queue items to load (using data-testid)
          const cardSelector = `[data-testid="listing-card-${listingId}"]`;
          await driver.wait(until.elementLocated(By.css(cardSelector)), 40000);
          const row = await driver.findElement(By.css(cardSelector));
          // click Approve button within the same card
          const approveBtn = await row.findElement(By.css(`[data-testid="approve-button-${listingId}"]`));
          await approveBtn.click();

          // wait and assert the item is removed from moderation queue
          await driver.wait(async () => {
            const els = await driver.findElements(By.css(cardSelector));
            return els.length === 0;
          }, 10000, 'Listing should be removed from moderation queue after approval');

          // Force UI refresh to ensure moderation queue is up to date
          await driver.get(`${BASE_URL}/admin-dashboard`);
          await driver.sleep(2000); // Give the UI time to reload

          // ----- Test reject path: create another listing and reject it
          const listing2 = await createListing(ownerToken, { title: title + ' 2', location: 'Test City', price: 5, description: 'to reject' });
          console.log('Created second listing:', listing2);
          assert(listing2.listingId, 'second listing creation failed');
          const id2 = listing2.listingId;
          createdListings.push(id2);
          const card2 = `[data-testid="listing-card-${id2}"]`;
          // Debug output before waiting for second card
          const allCards2 = await driver.findElements(By.css('[data-testid^="listing-card-"]'));
          console.log('Found listing cards after second creation:', allCards2.length);
          for (const card of allCards2) {
            const html = await card.getAttribute('outerHTML');
            console.log(html);
          }
          await driver.wait(until.elementLocated(By.css(card2)), 60000);
          const rejectBtn = await driver.findElement(By.css(`[data-testid="reject-button-${id2}"]`));
          // Set the prompt override again before clicking reject (in case of rerender)
          await driver.executeScript('window.prompt = function(){ return "Not acceptable"; };');
          await driver.sleep(500); // Ensure the override is set before clicking
          await rejectBtn.click();
          await driver.wait(async () => {
            const els = await driver.findElements(By.css(card2));
            return els.length === 0;
          }, 10000, 'Rejected listing should no longer be present in moderation queue');

          // ----- Test bulk approve/reject
          // create several listings
          const bulkIds = [];
          for (let i=0;i<3;i++) {
            const r = await createListing(ownerToken, { title: title + ' bulk ' + i, location: 'City', price: 1+i, description: 'bulk' });
            assert(r.listingId, 'bulk seed failed');
            bulkIds.push(r.listingId);
            createdListings.push(r.listingId);
          }
          // wait for them to appear
          await Promise.all(bulkIds.map(id => driver.wait(until.elementLocated(By.css(`[data-testid="listing-card-${id}"]`)), 40000)));
          // select them
          for (const id of bulkIds) {
            const checkbox = await driver.findElement(By.css(`[data-testid="bulk-select-checkbox-${id}"]`));
            await checkbox.click();
          }
          // click bulk approve
          const bulkApprove = await driver.findElement(By.css('[data-testid="bulk-approve-button"]'));
          await bulkApprove.click();
          // assert they are removed from moderation queue
          await Promise.all(bulkIds.map(id => driver.wait(async ()=>{
            const n = await driver.findElements(By.css(`[data-testid="listing-card-${id}"]`));
            return n.length === 0;
          }, 20000)));
    } finally {
      // Best-effort cleanup: delete any created listings using the owner's token
      try {
        if (typeof ownerToken !== 'undefined' && ownerToken) {
          for (const id of createdListings) {
            try {
              await deleteListing(ownerToken, id);
            } catch (e) {
              // ignore individual delete errors
            }
          }
        }
      } catch (e) {
        // ignore cleanup failure
      }

      try { if (driver) await driver.quit(); } catch (e) { /* ignore */ }
    }
  });
});
