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
  const adminToken = adminAuth.token;

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
      // Persist the created listing id to tmp file so the runner can clean up if tests crash
      try {
        const fs = require('fs');
        const path = require('path');
        const tmpDir = path.resolve(__dirname, '..', '..', 'tmp');
        try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) { /* ignore */ }
        const file = path.join(tmpDir, 'created-listings.txt');
        fs.appendFileSync(file, listingId + '\n');
      } catch (e) { console.warn('Failed to persist created listing id for cleanup:', e && e.message ? e.message : e); }

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

      // Wait for the UI to remove it from Pending
      await driver.wait(async () => {
        const els = await driver.findElements(By.css(`[data-testid="listing-card-${listingId}"]`));
        return els.length === 0;
      }, 15000, 'Listing should be removed from Pending after approval');

      // Quick UI check: try opening Approved tab and assert the listing appears there within a short timeout.
      try {
        console.log('Quick-check: opening Approved tab to verify listing moved...');
        // Ensure moderation main is active
        try { const mod = await driver.findElement(By.css('button[data-value="moderation"]')); await mod.click(); await driver.sleep(500); } catch (e) { /* ignore */ }
        const quickApprovedBtn = await driver.findElement(By.css('button[data-value="approved"]'));
        await quickApprovedBtn.click();
        // short wait for client to render the approved list
        await driver.wait(until.elementLocated(By.css(`[data-testid="listing-card-${listingId}"]`)), 10000);
        console.log('Quick-check: approved listing visible in Approved tab (UI).');
      } catch (quickErr) {
        console.log('Quick-check: approved listing not immediately visible in Approved tab; will poll backend and retry UI (fallback).', quickErr && (quickErr.message || quickErr));
      }

      // Helper: poll the public listing endpoint until the backend marks it Approved
      async function waitForListingStatus(id, desiredStatus, timeoutMs = 20000) {
        const end = Date.now() + timeoutMs;
        while (Date.now() < end) {
          try {
            const res = await fetch(`${API_URL}/api/listings/${id}`);
            if (res.ok) {
              const json = await res.json().catch(() => ({}));
              const status = json.status || json.Status || json.statusText || null;
              // normalize
              if (typeof status === 'string' && status.toLowerCase() === desiredStatus.toLowerCase()) return true;
              // some DTOs return numeric enums — handle common case 1=Approved etc if necessary (skip for now)
            }
          } catch (e) { /* ignore and retry */ }
          await new Promise(r => setTimeout(r, 1000));
        }
        throw new Error(`Listing ${id} did not reach status ${desiredStatus} in time`);
      }

      // Wait for backend status to be Approved, then refresh UI and check Approved tab
      await waitForListingStatus(listingId, 'Approved', 30000);

  // Ensure the Approved tab is selected and the approved listing appears there.
  // Sometimes the client hasn't refreshed its lists yet — re-open Moderation and click the Approved sub-tab explicitly, retrying if necessary.
  const approvedSelector = 'button[data-value="approved"]';
  const moderationMainSelector = 'button[data-value="moderation"]';
      let approvedTab;
      try {
        approvedTab = await driver.findElement(By.css(approvedSelector));
      } catch (e) {
        // If the tab isn't found yet, refresh and try again
        try { await driver.navigate().refresh(); } catch (ee) { /* ignore */ }
        await driver.sleep(1000);
        approvedTab = await driver.findElement(By.css(approvedSelector));
      }

      const maxApprovedWait = 60000; // increase to 60s for slow CI or backend processing
      const startApprovedWait = Date.now();
      let approvedFound = false;
      let lastErr = null;
      while (Date.now() - startApprovedWait < maxApprovedWait) {
        try {
          // Ensure Moderation main section is active so the Approved sub-tab exists in DOM
          try {
            const modBtn = await driver.findElement(By.css(moderationMainSelector));
            await modBtn.click();
            await driver.sleep(800);
          } catch (modErr) {
            // ignore if moderation main not present
          }

          // Try clicking the tab (may be stale across refreshes)
          try { await approvedTab.click(); } catch (clickErr) {
            // Try to re-find using the primary selector, then fall back to text-based XPath
            try { approvedTab = await driver.findElement(By.css(approvedSelector)); await approvedTab.click(); }
            catch (reErr) {
              try {
                // More specific: find an 'Approved' button inside the moderation area (if present)
                let xpath = "//button[contains(normalize-space(.), 'Approved') or contains(., 'Approved')]";
                // If there's a moderation container, narrow search
                try {
                  const modContainer = await driver.findElement(By.css('[data-testid="moderation-section"], [data-section="moderation"], div:has(button[data-value="pending"])'));
                  xpath = ".//button[contains(normalize-space(.), 'Approved') or contains(., 'Approved')]";
                  approvedTab = await modContainer.findElement(By.xpath(xpath));
                } catch (modContainerErr) {
                  // Fallback to global search
                  approvedTab = await driver.findElement(By.xpath(xpath));
                }
                await approvedTab.click();
              } catch (xpathErr) {
                // If click fails, try refreshing the page and continue the loop
                lastErr = xpathErr;
                try { await driver.navigate().refresh(); } catch (ee) { /* ignore */ }
                await driver.sleep(1000);
                continue;
              }
            }
          }

          // allow client to load approved list
          await driver.sleep(1500);
          const els = await driver.findElements(By.css(`[data-testid="listing-card-${listingId}"]`));
          if (els.length > 0) { approvedFound = true; break; }
        } catch (e) {
          lastErr = e;
          // On any unexpected error, refresh and retry
          try { await driver.navigate().refresh(); } catch (ee) { /* ignore */ }
        }
        await driver.sleep(1500);
      }
      if (!approvedFound) {
        // Try one final refresh + click before failing to capture state
        try { await driver.navigate().refresh(); } catch (e) { /* ignore */ }
        try {
          approvedTab = await driver.findElement(By.css(approvedSelector));
          await approvedTab.click();
          await driver.sleep(1500);
          const els = await driver.findElements(By.css(`[data-testid="listing-card-${listingId}"]`));
          if (els.length > 0) { approvedFound = true; }
        } catch (finalErr) {
          // fall through to failure below
          lastErr = finalErr || lastErr;
        }
      }
      if (!approvedFound) {
        console.error('DEBUG: failing after waiting for approved listing. last error:', lastErr && (lastErr.stack || lastErr.message || lastErr));
        throw new Error('Approved listing did not appear in Approved tab after approval');
      }

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
      // allow client to load approved list
      await driver.wait(async () => {
        const els = await driver.findElements(By.css(`[data-testid="listing-card-${listingId}"]`));
        return els.length > 0;
      }, 20000, 'Approved listing should appear in Approved tab');

      console.log('Clicking Rejected tab...');
      tab = await driver.findElement(By.css('button[data-value="rejected"]'));
      await tab.click();
      await driver.sleep(2000);
      card = await driver.findElement(By.css(`[data-testid="listing-card-${id2}"]`));
      assert(card, 'Rejected listing should be in Rejected tab');

      console.log('Test completed: moderation and listing actions verified.');
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
