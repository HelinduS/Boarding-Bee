const { getUniqueUserDataDir, getChromeOptions } = require('./seleniumTestUtils');
// user-login.test.js
// Selenium E2E tests for user login (happy path and edge cases)
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const os = require('os');
const path = require('path');
const fs = require('fs');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function getTestUser() {
  // Load from registration test output
  try {
    return JSON.parse(fs.readFileSync('tests/selenium/last_test_user.json', 'utf8'));
  } catch {
    return {
      email: 'selenium_test_user@example.com',
      password: 'TestPassword123!'
    };
  }
}

// --- Happy Path ---
async function happyPath() {
  try {
    require('child_process').execSync('pkill chrome || true');
  } catch (e) {}
  const user = getTestUser();
  const userDataDir = getUniqueUserDataDir('happyPath');
  const options = getChromeOptions(userDataDir, chrome);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.id('identifier')), 10000);
    await driver.findElement(By.id('identifier')).sendKeys(user.email);
    await driver.findElement(By.id('password')).sendKeys(user.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    // Wait for redirect to homepage
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url === baseUrl || url === baseUrl + '/';
    }, 10000);
    const homepageElement = await driver.findElement(By.css('nav, header, main'));
    const pageText = await homepageElement.getText();
    console.log('Homepage loaded. Visible text:', pageText);
    if (pageText.toLowerCase().includes('welcome') || pageText.toLowerCase().includes('home')) {
      console.log('User login happy path passed.');
    } else {
      throw new Error('Homepage loaded but expected text not found.');
    }
  } finally {
    await driver.quit();
  }
}

// --- Edge Cases ---
async function testInvalidEmailFormat() {
  try {
    require('child_process').execSync('pkill chrome || true');
  } catch (e) {}
  const userDataDir = getUniqueUserDataDir('testInvalidEmailFormat');
  const options = getChromeOptions(userDataDir, chrome);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.id('identifier')), 10000);
    await driver.findElement(By.id('identifier')).sendKeys('not-an-email');
    await driver.findElement(By.id('password')).sendKeys('TestPassword123!');
    await driver.findElement(By.css('button[type="submit"]')).click();
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('email')) {
        console.log('Invalid email format error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No invalid email format error shown');
  } finally {
    await driver.quit();
  }
}

async function testWrongPassword() {
  try {
    require('child_process').execSync('pkill chrome || true');
  } catch (e) {}
  const user = getTestUser();
  const userDataDir = getUniqueUserDataDir('testWrongPassword');
  console.log('Using Chrome user data dir:', userDataDir);
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.id('identifier')), 10000);
    await driver.findElement(By.id('identifier')).sendKeys(user.email);
    await driver.findElement(By.id('password')).sendKeys('WrongPassword!');
    await driver.findElement(By.css('button[type="submit"]')).click();
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('invalid')) {
        console.log('Wrong password error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No wrong password error shown');
  } finally {
    await driver.quit();
  }
}

async function testNonExistentEmail() {
  try {
    require('child_process').execSync('pkill chrome || true');
  } catch (e) {}
  const userDataDir = getUniqueUserDataDir('testNonExistentEmail');
  console.log('Using Chrome user data dir:', userDataDir);
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.id('identifier')), 10000);
    await driver.findElement(By.id('identifier')).sendKeys('doesnotexist@example.com');
    await driver.findElement(By.id('password')).sendKeys('SomePassword123!');
    await driver.findElement(By.css('button[type="submit"]')).click();
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid')) {
        console.log('Non-existent email error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No non-existent email error shown');
  } finally {
    await driver.quit();
  }
}

async function testBlankFields() {
  try {
    require('child_process').execSync('pkill chrome || true');
  } catch (e) {}
  const userDataDir = getUniqueUserDataDir('testBlankFields');
  console.log('Using Chrome user data dir:', userDataDir);
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
    await driver.wait(until.elementLocated(By.id('identifier')), 10000);
    // Leave both fields blank and submit
    await driver.findElement(By.css('button[type="submit"]')).click();
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg && msg.length > 0) {
        console.log('Required field error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No required field error shown');
  } finally {
    await driver.quit();
  }
}

(async function runUserLoginTests() {
  const failures = [];
  async function runTest(name, fn) {
    try {
      await fn();
      console.log(`✔ ${name} passed`);
    } catch (err) {
      console.error(`✘ ${name} failed:`, err.message);
      failures.push({ name, error: err.message });
    }
  }
  await runTest('User Login Happy Path', happyPath);
  await runTest('Invalid Email Format', testInvalidEmailFormat);
  await runTest('Wrong Password', testWrongPassword);
  await runTest('Non-existent Email', testNonExistentEmail);
  await runTest('Blank Fields', testBlankFields);
  console.log('\nUser Login Test Summary:');
  if (failures.length === 0) {
    console.log('All user login tests passed!');
  } else {
    failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    process.exitCode = 1;
  }
})();
