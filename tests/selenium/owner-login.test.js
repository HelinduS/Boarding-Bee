const { getUniqueUserDataDir, getChromeOptions } = require('./seleniumTestUtils');
// owner-login.test.js
// Selenium E2E tests for owner login (happy path and edge cases)
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const os = require('os');
const path = require('path');
const fs = require('fs');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function getOwnerTestUser() {
  return {
    email: 'selenium_owner_test@example.com',
    password: 'TestPassword123!',
  };
}

async function happyPath() {
  const user = getOwnerTestUser();
  try { require('child_process').execSync('pkill chrome || true'); } catch (e) { console.log('pkill chrome failed:', e.message); }
  const userDataDir = getUniqueUserDataDir('happyPath');
  const options = getChromeOptions(userDataDir, chrome);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
    // Wait for redirect or dashboard
    await driver.wait(until.urlMatches(/dashboard|owner/i), 10000);
    console.log('Owner login happy path passed.');
  } finally {
    await driver.quit();
  }
}

async function testInvalidEmail() {
  try { require('child_process').execSync('pkill chrome || true'); } catch (e) { console.log('pkill chrome failed:', e.message); }
  const userDataDir = getUniqueUserDataDir('testInvalidEmail');
  const options = getChromeOptions(userDataDir, chrome);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys('notanemail');
  await driver.findElement(By.id('password')).sendKeys('irrelevant');
  await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see error about invalid email
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('email')) {
        console.log('Invalid email error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No invalid email error shown');
  } finally {
    await driver.quit();
  }
}

async function testWrongPassword() {
  const user = getOwnerTestUser();
  try { require('child_process').execSync('pkill chrome || true'); } catch (e) { console.log('pkill chrome failed:', e.message); }
  const userDataDir = getUniqueUserDataDir('testWrongPassword');
  const options = getChromeOptions(userDataDir, chrome);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys('WrongPassword!');
  await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see error about wrong password
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
  try { require('child_process').execSync('pkill chrome || true'); } catch (e) { console.log('pkill chrome failed:', e.message); }
  const userDataDir = getUserDataDir();
  console.log('Using Chrome user data dir:', userDataDir);
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  await driver.findElement(By.id('identifier')).sendKeys('doesnotexist_owner@example.com');
  await driver.findElement(By.id('password')).sendKeys('SomePassword123!');
  await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see error about user not found
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
  try { require('child_process').execSync('pkill chrome || true'); } catch (e) { console.log('pkill chrome failed:', e.message); }
  const userDataDir = getUserDataDir();
  console.log('Using Chrome user data dir:', userDataDir);
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/login`);
  await driver.wait(until.elementLocated(By.id('identifier')), 10000);
  // Leave both fields blank and submit
  await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see errors about required fields
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

(async function runOwnerLoginTests() {
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
  await runTest('Owner Login Happy Path', happyPath);
  await runTest('Invalid Email Format', testInvalidEmail);
  await runTest('Wrong Password', testWrongPassword);
  await runTest('Non-existent Email', testNonExistentEmail);
  await runTest('Blank Fields', testBlankFields);
  console.log('\nOwner Login Test Summary:');
  if (failures.length === 0) {
    console.log('All owner login tests passed!');
  } else {
    failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    process.exitCode = 1;
  }
})();
