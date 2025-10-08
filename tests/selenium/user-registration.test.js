// user-registration.test.js
// Selenium E2E tests for user registration (happy path and edge cases)
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const os = require('os');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

function getFixedTestUser() {
  return {
    username: 'selenium_test_user',
    email: 'selenium_test_user@example.com',
    password: 'TestPassword123!',
    userType: 'student',
    firstName: 'Selenium',
    lastName: 'Test',
    gender: 'other',
    institutionCompany: 'Test University',
    location: 'Test City',
    phoneNumber: '1234567890',
    emergencyContact: '0987654321',
    permanentAddress: '123 Test Street',
  };
}

// --- Happy Path ---
async function happyPath() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const user = getFixedTestUser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get(`${baseUrl}/register`);
    // Step 0: Account
    await driver.wait(until.elementLocated(By.css('input#username')), 10000);
    await driver.findElement(By.css('input#username')).clear();
    await driver.findElement(By.css('input#username')).sendKeys(user.username);
    await driver.findElement(By.css('input#email')).clear();
    await driver.findElement(By.css('input#email')).sendKeys(user.email);
    await driver.findElement(By.css('input#password')).clear();
    await driver.findElement(By.css('input#password')).sendKeys(user.password);
    await driver.findElement(By.css('input#confirmPassword')).clear();
    await driver.findElement(By.css('input#confirmPassword')).sendKeys(user.password);
    await driver.findElement(By.css('[role="combobox"]')).click();
    await driver.sleep(500);
    const options = await driver.findElements(By.xpath("//*[@role='option']"));
    let studentOption = null;
    for (const option of options) {
      const text = await option.getText();
      if (text.trim().toLowerCase().includes('student')) {
        studentOption = option;
      }
    }
    if (studentOption) {
      await driver.wait(until.elementIsVisible(studentOption), 2000);
      await studentOption.click();
    } else {
      throw new Error('Student option not found');
    }
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
    // Step 1: Personal
    await driver.wait(until.elementLocated(By.css('input#firstName')), 10000);
    await driver.findElement(By.css('input#firstName')).sendKeys(user.firstName);
    await driver.findElement(By.css('input#lastName')).sendKeys(user.lastName);
    await driver.findElement(By.css('input[type="radio"][value="other"]')).click();
    await driver.findElement(By.css('input#institutionCompany')).sendKeys(user.institutionCompany);
    await driver.findElement(By.css('input#location')).sendKeys(user.location);
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
    // Step 2: Contact
    await driver.wait(until.elementLocated(By.css('input#phoneNumber')), 10000);
    await driver.findElement(By.css('input#phoneNumber')).sendKeys(user.phoneNumber);
    await driver.findElement(By.css('input#emergencyContact')).sendKeys(user.emergencyContact);
    await driver.findElement(By.css('input#permanentAddress')).sendKeys(user.permanentAddress);
    await driver.findElement(By.xpath("//button[contains(., 'Register')]")).click();
    await driver.sleep(2000);
    await driver.wait(until.urlContains('/login'), 10000);
    console.log('User registration happy path passed.');
    fs.writeFileSync('tests/selenium/last_test_user.json', JSON.stringify(user));
  } finally {
    await driver.quit();
  }
}

// --- Edge Cases ---
async function testInvalidEmail() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get('http://localhost:3000/register');
    await driver.wait(until.elementLocated(By.css('input#username')), 10000);
    await driver.findElement(By.css('input#username')).sendKeys('edgecase_user');
    await driver.findElement(By.css('input#email')).sendKeys('not-an-email');
    await driver.findElement(By.css('input#password')).sendKeys('TestPassword123!');
    await driver.findElement(By.css('input#confirmPassword')).sendKeys('TestPassword123!');
    await driver.findElement(By.css('[role="combobox"]')).click();
    await driver.sleep(500);
    const options = await driver.findElements(By.xpath("//*[@role='option']"));
    await options[0].click();
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
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

async function testUnmatchedPasswords() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get('http://localhost:3000/register');
    await driver.wait(until.elementLocated(By.css('input#username')), 10000);
    await driver.findElement(By.css('input#username')).sendKeys('edgecase_user2');
    await driver.findElement(By.css('input#email')).sendKeys('edgecase_user2@example.com');
    await driver.findElement(By.css('input#password')).sendKeys('TestPassword123!');
    await driver.findElement(By.css('input#confirmPassword')).sendKeys('DifferentPassword!');
    await driver.findElement(By.css('[role="combobox"]')).click();
    await driver.sleep(500);
    const options = await driver.findElements(By.xpath("//*[@role='option']"));
    await options[0].click();
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('password')) {
        console.log('Unmatched password error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No unmatched password error shown');
  } finally {
    await driver.quit();
  }
}

async function testRequiredFields() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get('http://localhost:3000/register');
    await driver.wait(until.elementLocated(By.css('input#username')), 10000);
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
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

async function testDuplicateEmail() {
  const user = getFixedTestUser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));
  const options = new chrome.Options().addArguments(`--user-data-dir=${userDataDir}`);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get('http://localhost:3000/register');
    await driver.wait(until.elementLocated(By.css('input#username')), 10000);
    await driver.findElement(By.css('input#username')).sendKeys(user.username);
    await driver.findElement(By.css('input#email')).sendKeys(user.email);
    await driver.findElement(By.css('input#password')).sendKeys(user.password);
    await driver.findElement(By.css('input#confirmPassword')).sendKeys(user.password);
    await driver.findElement(By.css('[role="combobox"]')).click();
    await driver.sleep(500);
    const options = await driver.findElements(By.xpath("//*[@role='option']"));
    await options[0].click();
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
    await driver.findElement(By.css('input#firstName')).sendKeys(user.firstName);
    await driver.findElement(By.css('input#lastName')).sendKeys(user.lastName);
    await driver.findElement(By.css('input[type="radio"][value="other"]')).click();
    await driver.findElement(By.css('input#institutionCompany')).sendKeys(user.institutionCompany);
    await driver.findElement(By.css('input#location')).sendKeys(user.location);
    await driver.findElement(By.xpath("//button[contains(., 'Next')]")).click();
    await driver.findElement(By.css('input#phoneNumber')).sendKeys(user.phoneNumber);
    await driver.findElement(By.css('input#emergencyContact')).sendKeys(user.emergencyContact);
    await driver.findElement(By.css('input#permanentAddress')).sendKeys(user.permanentAddress);
    await driver.findElement(By.xpath("//button[contains(., 'Register')]")).click();
    await driver.sleep(2000);
    const errorEls = await driver.findElements(By.css('[role="alert"], .text-red-500, .error, .alert'));
    let found = false;
    for (const el of errorEls) {
      const msg = await el.getText();
      if (msg.toLowerCase().includes('exists')) {
        console.log('Duplicate email/username error shown:', msg);
        found = true;
      }
    }
    if (!found) throw new Error('No duplicate email/username error shown');
  } finally {
    await driver.quit();
  }
}

(async function runUserRegistrationTests() {
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
  await runTest('User Registration Happy Path', happyPath);
  await runTest('Invalid Email', testInvalidEmail);
  await runTest('Unmatched Passwords', testUnmatchedPasswords);
  await runTest('Required Fields Blank', testRequiredFields);
  await runTest('Duplicate Email/Username', testDuplicateEmail);
  console.log('\nUser Registration Test Summary:');
  if (failures.length === 0) {
    console.log('All user registration tests passed!');
  } else {
    failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    process.exitCode = 1;
  }
})();
