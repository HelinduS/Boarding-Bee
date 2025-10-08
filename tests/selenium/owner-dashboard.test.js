// owner-dashboard.test.js
// Selenium E2E tests for Owner Dashboard (after login)
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const os = require('os');
const path = require('path');
const fs = require('fs');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function getOwnerTestUser() {
  try {
    return JSON.parse(fs.readFileSync('tests/selenium/last_test_owner.json', 'utf8'));
  } catch {
    return {
      email: 'selenium_owner_test@example.com',
      password: 'TestPassword123!'
    };
  }
}

async function loginAsOwner(driver) {
  const user = getOwnerTestUser();
  await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.urlContains('/owner-dashboard'), 10000);
}

/**
 * Helper: find the first row for a listing title and return row + action buttons
 */
async function getFirstRowAndButtons(driver, listingTitle = 'Selenium Test Listing') {
  await driver.wait(until.elementLocated(By.css('table')), 15000);
  // Make sure rows are present (dashboard may load async)
  await driver.wait(until.elementLocated(By.css('tbody tr')), 30000);

  await driver.wait(async () => {
    const rows = await driver.findElements(
      By.xpath(`//tbody/tr[td/div[normalize-space(text())='${listingTitle}']]`)
    );
    return rows.length > 0;
  }, 15000, `Timed out waiting for row with title: ${listingTitle}`);

  const rows = await driver.findElements(
    By.xpath(`//tbody/tr[td/div[normalize-space(text())='${listingTitle}']]`)
  );
  if (!rows.length) throw new Error(`Could not find row for listing with title: ${listingTitle}`);

  const firstRow = rows[0];
  const actionsCell = await firstRow.findElement(By.css('td:last-child'));
  const buttons = await actionsCell.findElements(By.css('button'));
  return { firstRow, buttons };
}

async function testOwnerDashboardFlows() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    // -------------------------
    // 1) Login as owner
    // -------------------------
    await loginAsOwner(driver);
    console.log('✔ Owner login successful');

    // -------------------------
    // 2) Listing Flows (CREATE -> verify in table)
    // -------------------------
    console.log('--- Test: Listing Flows ---');

    // Navigate to Create Listing
    const createBtn = await driver.findElement(By.xpath("//button[contains(.,'Create Listing')]"));
    console.log('Clicking Create Listing button');
    await createBtn.click();
    await driver.wait(until.urlContains('/create-listing'), 10000);

    // Fill the form
    let titleField;
    try {
      titleField = await driver.wait(until.elementLocated(By.id('title')), 10000);
    } catch (e) {
      console.log('Title field not found after navigation:', e.message);
      // print page HTML for debug
      try {
        const body = await driver.findElement(By.css('body'));
        const html = await body.getAttribute('outerHTML');
        console.log('Page HTML after navigation:', html);
      } catch (inner) {
        console.log('Could not print page HTML:', inner.message);
      }
      throw e;
    }

    await titleField.sendKeys('Selenium Test Listing');
    await driver.findElement(By.id('location')).sendKeys('Colombo');
    await driver.findElement(By.id('price')).sendKeys('10000');
    await driver.findElement(By.id('description')).sendKeys('Test description');
    await driver.findElement(By.id('facilities')).sendKeys('wifi,parking');

    const imageInput = await driver.findElement(By.id('images'));
    const imagePath = path.resolve(__dirname, 'test-image.png');
    await imageInput.sendKeys(imagePath);

    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/owner-dashboard'), 10000);
    console.log('✔ Listing created and navigated back to dashboard.');

    // Verify new listing appears
    await driver.wait(until.elementLocated(By.css('table')), 15000);
    await driver.wait(until.elementLocated(By.css('tbody tr')), 30000);
    await driver.wait(until.elementLocated(By.xpath(`//td[contains(.,'Selenium Test Listing')]`)), 10000);
    console.log('✔ New listing appears in dashboard table.');

    // -------------------------
    // 3) Edit Profile (optional)
    // -------------------------
    try {
      const editProfileBtn = await driver.findElement(
        By.xpath("//a[@href='/user-profile']//*[contains(translate(normalize-space(text()), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'edit profile')]")
      );
      await editProfileBtn.click();
      await driver.wait(until.urlContains('/user-profile'), 10000);
      console.log('✔ Navigated to edit profile.');
      await driver.navigate().back();
      await driver.wait(until.urlContains('/owner-dashboard'), 10000);
      // ensure table is back
      await driver.wait(until.elementLocated(By.css('table')), 15000);
      await driver.wait(until.elementLocated(By.css('tbody tr')), 30000);
    } catch (e) {
      console.log('Edit profile button not found:', e.message);
    }

    // -------------------------
    // 4) Edit / View / Renew / Delete actions
    // -------------------------

    // Edit
    {
      const { buttons } = await getFirstRowAndButtons(driver);
      if (buttons.length < 2) throw new Error('Not enough action buttons for Edit.');
      await buttons[1].click();
      await driver.wait(until.urlContains('/edit-details/'), 10000);
      console.log('✔ Navigated to edit details.');
      await driver.navigate().back();
      await driver.wait(until.urlContains('/owner-dashboard'), 10000);
      await driver.wait(until.elementLocated(By.css('table')), 15000);
    }

    // View
    {
      const { buttons } = await getFirstRowAndButtons(driver);
      if (buttons.length < 1) throw new Error('Not enough action buttons for View.');
      await buttons[0].click();
      await driver.sleep(1000);
      await driver.wait(until.urlContains('/view-details/'), 10000);
      console.log('✔ Navigated to view details.');
    }

    // -------------------------
    // 5) Ratings & Reviews (owner cannot review own listing)
    // -------------------------
    // The backend blocks owners from reviewing their own listings.
    // Skipping review/rating flow for owner user.
    console.log('ℹ Skipping review/rating flow for owner user (backend blocks this action).');

    // To test review/rating acceptance criteria, log in as a tenant/test user and perform review/rating flows on this listing.
    // (See: add separate test for tenant review/rating flows.)
    await driver.navigate().back();
    await driver.wait(until.urlContains('/owner-dashboard'), 10000);
    await driver.wait(until.elementLocated(By.css('table')), 15000);
    // Renew (4th button, if present)
    {
      const { buttons } = await getFirstRowAndButtons(driver);
      if (buttons.length > 3) {
        await buttons[3].click();
        await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Renew Listing')]")), 5000);
        const confirmRenewBtn = await driver.findElement(By.xpath("//button[contains(.,'Renew Listing')]"));
        await confirmRenewBtn.click();
        await driver.sleep(1000);
        console.log('✔ Renew flow executed (if available).');
      }
    }

    // Delete (3rd button)
    {
      const { buttons } = await getFirstRowAndButtons(driver);
      if (buttons.length < 3) throw new Error('Not enough action buttons for Delete.');
      await buttons[2].click();
      await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Delete') and @class and contains(@class,'bg-destructive')]")), 5000);
      const confirmDeleteBtnFinal = await driver.findElement(By.xpath("//button[contains(.,'Delete') and @class and contains(@class,'bg-destructive')]"));
      await confirmDeleteBtnFinal.click();
      await driver.sleep(1000);
      console.log('✔ Delete flow executed.');
    }

    // Pagination (optional)
    {
      const nextBtn = await driver.findElements(By.xpath("//button[contains(.,'Next')]"));
      if (nextBtn.length > 0) {
        await nextBtn[0].click();
        await driver.sleep(500);
        console.log('✔ Pagination Next clicked (if available).');
      }
    }

    console.log('Owner dashboard E2E test completed.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

testOwnerDashboardFlows();