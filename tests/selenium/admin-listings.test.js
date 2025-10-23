/* eslint-disable no-console */
const { Builder, By, until } = require('selenium-webdriver');
const { getChromeOptions } = require('./seleniumTestUtils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL  = process.env.API_URL  || 'http://127.0.0.1:5000';

// --- API helpers ---
async function registerUser(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  return res;
}

async function loginUser(identifier, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function createListing(token, payload) {
  const res = await fetch(`${API_URL}/api/listings/json`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); }
  catch (e) { throw new Error(`createListing: invalid JSON response (status ${res.status}): ${text}`); }
  if (!res.ok) throw new Error(`createListing failed: ${res.status} ${text}`);
  return json;
}

async function deleteListing(token, id) {
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res;
  } catch {
    return null; // best-effort cleanup
  }
}

/**
 * Idempotent: try register; if exists, login.
 * Returns { token, user? }
 */
async function registerOrLogin(user) {
  const body = {
    ...user,
    phoneNumber: '1234567890',
    permanentAddress: 'addr',
    gender: 'other',
    emergencyContact: '0987654321',
    institutionCompany: '',
    location: '',
  };

  const regRes = await registerUser(body);

  if (!regRes.ok) {
    // User probably exists (409/400) → login
    const login = await loginUser(user.email, user.password);
    assert(login.ok && login.json && login.json.token, `login failed for existing user ${user.email}, status ${login.status}`);
    return { token: login.json.token, user: login.json.user };
  }

  // Newly created → login
  const login = await loginUser(user.email, user.password);
  assert(login.ok && login.json && login.json.token, `login failed after register for ${user.email}, status ${login.status}`);
  return { token: login.json.token, user: login.json.user };
}

// --- test data (KEEP STATIC EMAILS) ---
const owner = {
  username: 'e2e_owner',
  email: 'e2e_owner@example.com',
  password: 'TestPass123!',
  firstName: 'Owner',
  lastName: 'E2E',
  userType: 'owner',
  role: 'OWNER',
};

const admin = {
  username: 'e2e_admin',
  email: 'e2e_admin@example.com',
  password: 'AdminPass123!',
  firstName: 'Admin',
  lastName: 'E2E',
  userType: 'admin',
  role: 'ADMIN', // ensure backend truly grants ADMIN to this user (seed/promotion)
};

describe('Admin moderation E2E', function () {
  this.timeout(120000); // 2 minutes

  it('admin can approve a pending listing and perform bulk/reject flows', async function () {
    // Track created listings for cleanup
    const createdListings = [];

    // Register or login owner/admin (idempotent)
    const ownerAuth = await registerOrLogin(owner);
    assert(ownerAuth.token, 'owner token missing');
    const ownerToken = ownerAuth.token;

    const adminAuth = await registerOrLogin(admin);
    assert(adminAuth.token, 'admin token missing');

    // Start Selenium
    const options = getChromeOptions('admin-moderation');
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
      // 1) Create pending listing via API (owner)
      const title = 'E2E Admin Listing ' + Date.now();
      const listingPayload = { title, location: 'Test City', price: 10.0, description: 'E2E listing for moderation test' };
      const createRes = await createListing(ownerToken, listingPayload);
      assert(createRes.listingId, 'listingId should be returned');
      const listingId = createRes.listingId;
      createdListings.push(listingId);

      // 2) Login as admin via UI
      await driver.get(`${BASE_URL}/login`);
      await driver.wait(until.elementLocated(By.css('input#identifier')), 15000);
      await driver.findElement(By.css('input#identifier')).clear();
      await driver.findElement(By.css('input#identifier')).sendKeys(admin.email);
      await driver.findElement(By.css('input#password')).sendKeys(admin.password);
      await driver.findElement(By.css('button[type="submit"]')).click();

      // Wait for redirect to admin dashboard
      await driver.wait(until.urlContains('/admin-dashboard'), 15000);

      // Ensure prompt does not block rejections
      await driver.executeScript('window.prompt = function(){ return "Not acceptable"; };');

      // Force reload and open Moderation → Pending
      await driver.get(`${BASE_URL}/admin-dashboard`);
      await driver.sleep(2000);

      console.log('Clicking Moderation tab (after reload)...');
      let tab = await driver.findElement(By.css('button[data-value="moderation"]'));
      await tab.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const cls = await tab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Moderation tab did not become active');

      console.log('Clicking Pending tab (after reload)...');
      tab = await driver.findElement(By.xpath("//button[starts-with(normalize-space(.), 'Pending') or contains(., 'Pending')]"));
      await tab.click();
      await driver.sleep(5000);

      // 3) Confirm the new listing is visible in Pending
      const cards = await driver.findElements(By.css('[data-testid^="listing-card-"]'));
      console.log('Cards found in Pending tab:', cards.length);

      let card = null;
      let start = Date.now();
      let found = false;
      while (Date.now() - start < 30000) {
        try {
          card = await driver.findElement(By.css(`[data-testid="listing-card-${listingId}"]`));
          if (card) { found = true; break; }
        } catch { /* not found yet */ }
        await driver.sleep(1000);
      }
      if (!found) {
        throw new Error(`Listing card for id ${listingId} should be visible in Pending`);
      }
      const cardText = await card.getText();
      assert(cardText, `Listing card for id ${listingId} should be visible in Pending`);
      await driver.sleep(500);

      // Approve the first listing
      console.log('Approving first listing...');
      let approveBtn = await driver.findElement(By.css(`[data-testid="approve-button-${listingId}"]`));
      await driver.executeScript('arguments[0].scrollIntoView(true);', approveBtn);
      await driver.sleep(1000);
      await approveBtn.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const els = await driver.findElements(By.css(`[data-testid="listing-card-${listingId}"]`));
        return els.length === 0;
      }, 15000, 'Listing should be removed from Pending after approval');

      // Create and reject a second listing
      const listing2 = await createListing(ownerToken, { title: title + ' 2', location: 'Test City', price: 5, description: 'to reject' });
      assert(listing2.listingId, 'second listing creation failed');
      const id2 = listing2.listingId;
      createdListings.push(id2);

      await driver.wait(until.elementLocated(By.css(`[data-testid="listing-card-${id2}"]`)), 30000);
      let rejectBtn = await driver.findElement(By.css(`[data-testid="reject-button-${id2}"]`));
      await driver.executeScript('arguments[0].scrollIntoView(true);', rejectBtn);
      await driver.sleep(1000);
      await rejectBtn.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const els = await driver.findElements(By.css(`[data-testid="listing-card-${id2}"]`));
        return els.length === 0;
      }, 15000, 'Listing should be removed from Pending after rejection');

      // 4) Tabs: Approved / Rejected
      console.log('Clicking Approved tab...');
      tab = await driver.findElement(By.css('button[data-value="approved"]'));
      await tab.click();
      await driver.sleep(2000);
      card = await driver.findElement(By.css(`[data-testid="listing-card-${listingId}"]`));
      assert(card, 'Approved listing should be in Approved tab');

      console.log('Clicking Rejected tab...');
      tab = await driver.findElement(By.css('button[data-value="rejected"]'));
      await tab.click();
      await driver.sleep(2000);
      card = await driver.findElement(By.css(`[data-testid="listing-card-${id2}"]`));
      assert(card, 'Rejected listing should be in Rejected tab');

      // 5) Activity / Security / Reports navigation
      console.log('Clicking Activity Log tab...');
      tab = await driver.findElement(By.css('button[data-value="activity"]'));
      await tab.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const cls = await tab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Activity Log tab did not become active');

      console.log('Clicking Security tab...');
      tab = await driver.findElement(By.css('button[data-value="security"]'));
      await tab.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const cls = await tab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Security tab did not become active');

      console.log('Clicking Reports tab...');
      tab = await driver.findElement(By.css('button[data-value="reports"]'));
      await tab.click();
      await driver.sleep(2000);
      await driver.wait(async () => {
        const cls = await tab.getAttribute('class');
        return cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background');
      }, 3000, 'Reports tab did not become active');

      console.log('Test completed: All navigation and moderation actions verified.');
    } finally {
      // Best-effort: delete created listings with owner token
      try {
        if (ownerToken) {
          for (const id of new Set(createdListings)) {
            try { await deleteListing(ownerToken, id); }
            catch { /* ignore individual delete errors */ }
          }
        }
      } catch { /* ignore */ }

      try { await driver.quit(); } catch { /* ignore */ }
    }
  });
});
