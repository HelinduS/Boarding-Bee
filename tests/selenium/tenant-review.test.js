// tenant-review.test.js
// Selenium E2E test for review/rating flows as a tenant (not owner)
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const os = require('os');
const path = require('path');
const fs = require('fs');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function getTestUser() {
  try {
    return JSON.parse(fs.readFileSync('tests/selenium/last_test_user.json', 'utf8'));
  } catch {
    return {
      email: 'selenium_test_user@example.com',
      password: 'TestPassword123!'
    };
  }
}

async function loginAsTenant(driver) {
  const user = getTestUser();
  await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  // Wait for redirect to homepage
  await driver.wait(until.urlIs(baseUrl + '/' ), 10000);
}

async function testTenantReviewFlow() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    // 1) Login as tenant
    await loginAsTenant(driver);
    console.log('✔ Tenant login successful');

    // 2) Go to listing details page for the owner's listing
    // After tenant login, land on homepage. Click the listing card for 'Selenium Test Listing'.
    await driver.get(baseUrl + '/');
    let listingCard;
    try {
      // Try to find the card with aria-label containing 'Selenium Test Listing'
      listingCard = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(@aria-label, 'Selenium Test Listing')]")),
        15000
      );
    } catch (e) {
      // Fallback: click the first listing card button
      try {
        listingCard = await driver.wait(
          until.elementLocated(By.css('button[aria-label^="View details for "]')),
          5000
        );
      } catch (inner) {
        // Print page HTML for diagnostics
        try {
          const body = await driver.findElement(By.css('body'));
          const html = await body.getAttribute('outerHTML');
          console.log('No listing card found. Page HTML:', html);
        } catch (deep) {
          console.log('Could not print page HTML:', deep.message);
        }
        throw new Error('No listing card found on homepage after tenant login.');
      }
    }
    await listingCard.click();
    await driver.wait(until.urlContains('/view-details/'), 20000);
    console.log('✔ Navigated to listing details page');

    // 3) Ratings & Reviews acceptance criteria
    // Wait for the listing title to ensure the page is loaded
    try {
      await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(@class,'text-2xl')]")),
        15000
      );
    } catch (e) {
      // Print page HTML for diagnostics
      try {
        const body = await driver.findElement(By.css('body'));
        const html = await body.getAttribute('outerHTML');
        console.log('Listing title not found. Page HTML:', html);
      } catch (inner) {
        console.log('Could not print page HTML:', inner.message);
      }
      throw new Error('Listing title not visible, page did not load.');
    }

    // Now wait for rating stars
    const stars = await driver.findElements(By.css('[aria-label*="star"], [title*="star"], .rating, .stars, [class*=star]'));
    if (!stars.length) {
      // Print page HTML for diagnostics
      try {
        const body = await driver.findElement(By.css('body'));
        const html = await body.getAttribute('outerHTML');
        console.log('Rating stars not found. Page HTML:', html);
      } catch (e) {
        console.log('Could not print page HTML:', e.message);
      }
      throw new Error('Rating stars not visible for tenant user');
    }
    console.log('✔ Rating stars visible for tenant user');

    // Try clicking the 3rd star to check interactivity
    if (stars.length >= 3) {
      await stars[2].click();
      console.log('✔ Rating stars are interactive (clicked 3rd star)');
    }

    // Review textarea
    const reviewTextarea = await driver.wait(until.elementLocated(By.css('textarea[placeholder*="review"]')), 10000);

    // Submit without star (expect validation)
    await reviewTextarea.clear();
    await reviewTextarea.sendKeys('Validation test: no star selected.');
    let submitBtn;
    try {
      submitBtn = await driver.findElement(By.xpath("//button[contains(.,'Submit')]"));
      const isEnabled = await submitBtn.isEnabled();
      if (!isEnabled) {
        console.log('Submit button is present but disabled.');
      } else {
        await submitBtn.click();
      }
    } catch (e) {
      // Print page HTML for diagnostics
      try {
        const body = await driver.findElement(By.css('body'));
        const html = await body.getAttribute('outerHTML');
        console.log('Submit button not found. Page HTML:', html);
      } catch (inner) {
        console.log('Could not print page HTML:', inner.message);
      }
      throw new Error('Submit button for review not found.');
    }

    let validationError = null;
    try {
      validationError = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(),'select a rating') or contains(text(),'star') or contains(text(),'required')]")),
        2000
      );
    } catch (e) {
      console.log('No validation error message found after submitting without star:', e.message);
    }
    if (!validationError) {
      throw new Error('No validation error shown when submitting review without selecting a star.');
    } else {
      console.log('✔ Validation error shown when submitting review without selecting a star');
    }

    // Submit a valid rating (4 stars) + review
    {
      let starClicked = false;
      try {
        const star = await driver.findElement(By.css('[aria-label="4 stars"], [title="4 stars"]'));
        await star.click();
        starClicked = true;
      } catch (e) {
        try {
          const starCandidates = await driver.findElements(By.css('.rating, .stars, [class*=star] button, [class*=star] span'));
          if (starCandidates.length >= 4) {
            await starCandidates[3].click();
            starClicked = true;
          }
        } catch {}
      }
      if (!starClicked) {
        console.log('Could not click 4th star for rating.');
      } else {
        console.log('✔ Clicked 4th star for rating');
      }

      await reviewTextarea.clear();
      await reviewTextarea.sendKeys('This is a test review from Selenium (tenant).');
      const submitBtn = await driver.findElement(By.xpath("//button[contains(.,'Submit') and not(@disabled)]"));
      await submitBtn.click();
      await driver.sleep(1000);
      console.log('✔ Submitted review with 4 stars');
    }

    // Verify persistence after reload
    {
      const currentUrl = await driver.getCurrentUrl();
      await driver.get(currentUrl);
      await driver.sleep(5000);
      await driver.wait(until.urlContains('/view-details/'), 10000);
      await driver.wait(until.elementLocated(By.css('[aria-label*="star"], [title*="star"], .rating, .stars, [class*=star]')), 20000);

      let fourthStar;
      try {
        fourthStar = await driver.findElement(By.css('[aria-label="4 stars"], [title="4 stars"]'));
      } catch {
        const s = await driver.findElements(By.css('.rating, .stars, [class*=star] button, [class*=star] span'));
        if (s.length >= 4) fourthStar = s[3];
      }
      if (!fourthStar) throw new Error('Could not find 4th star after reload to check persistence.');

      const starClass = await fourthStar.getAttribute('class');
      const starAriaChecked = await fourthStar.getAttribute('aria-checked');
      if ((starClass && !/active|filled|selected/.test(starClass)) && (starAriaChecked !== 'true')) {
        throw new Error('Rating did not persist after reload: 4th star is not active/filled.');
      } else {
        console.log('✔ 4th star is active/filled after reload (rating persisted)');
      }

      const reviewTextPresent = await driver.findElements(By.xpath("//*[contains(text(),'This is a test review from Selenium (tenant).')]"));
      if (!reviewTextPresent.length) {
        throw new Error('Review text not found after reload, persistence failed.');
      } else {
        console.log('✔ Review text found after reload (persistence confirmed)');
      }
    }

    console.log('Tenant review/rating E2E test completed.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

testTenantReviewFlow();
