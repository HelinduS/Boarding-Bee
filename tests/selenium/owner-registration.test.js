// owner-registration.test.js
// Selenium E2E tests for owner registration (happy path and edge cases)
const { Builder, By, until } = require('selenium-webdriver');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

function getOwnerTestUser() {
  return {
    username: 'selenium_owner_test',
    firstName: 'Owner',
    lastName: 'Test',
    email: 'selenium_owner_test@example.com',
    password: 'TestPassword123!',
    business: 'Test Business',
    location: 'Test City',
  };
}

async function happyPath() {
  const user = getOwnerTestUser();
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(`${baseUrl}/register-owner`);
    await driver.wait(until.elementLocated(By.css('input[name="username"]')), 10000);
    await driver.findElement(By.css('input[name="username"]')).sendKeys(user.username);
    await driver.findElement(By.css('input[name="firstName"]')).sendKeys(user.firstName);
    await driver.findElement(By.css('input[name="lastName"]')).sendKeys(user.lastName);
    await driver.findElement(By.css('input[name="email"]')).sendKeys(user.email);
    await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
    await driver.findElement(By.css('input[name="confirmPassword"]')).sendKeys(user.password);
    await driver.findElement(By.css('input[name="business"]')).sendKeys(user.business);
    await driver.findElement(By.css('input[name="location"]')).sendKeys(user.location);
    await driver.findElement(By.css('button[type="submit"]')).click();
    // Wait for success message or redirect
    await driver.wait(until.urlContains('/login'), 10000);
    console.log('Owner registration happy path passed.');
  } finally {
    await driver.quit();
  }
}

async function testUnmatchedPasswords() {
  const user = getOwnerTestUser();
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(`${baseUrl}/register-owner`);
    await driver.wait(until.elementLocated(By.css('input[name="username"]')), 10000);
    await driver.findElement(By.css('input[name="username"]')).sendKeys(user.username + '2');
    await driver.findElement(By.css('input[name="firstName"]')).sendKeys(user.firstName);
    await driver.findElement(By.css('input[name="lastName"]')).sendKeys(user.lastName);
    await driver.findElement(By.css('input[name="email"]')).sendKeys('owner2@example.com');
    await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
    await driver.findElement(By.css('input[name="confirmPassword"]')).sendKeys('DifferentPassword!');
    await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see an error about unmatched passwords
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
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(`${baseUrl}/register-owner`);
    await driver.wait(until.elementLocated(By.css('input[name="username"]')), 10000);
    // Leave all fields blank and submit
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

async function testDuplicateEmail() {
  const user = getOwnerTestUser();
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(`${baseUrl}/register-owner`);
    await driver.wait(until.elementLocated(By.css('input[name="username"]')), 10000);
    await driver.findElement(By.css('input[name="username"]')).sendKeys(user.username);
    await driver.findElement(By.css('input[name="firstName"]')).sendKeys(user.firstName);
    await driver.findElement(By.css('input[name="lastName"]')).sendKeys(user.lastName);
    await driver.findElement(By.css('input[name="email"]')).sendKeys(user.email);
    await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
    await driver.findElement(By.css('input[name="confirmPassword"]')).sendKeys(user.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    // Should see an error about duplicate email/username
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

(async function runOwnerRegistrationTests() {
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
  await runTest('Owner Registration Happy Path', happyPath);
  await runTest('Unmatched Passwords', testUnmatchedPasswords);
  await runTest('Required Fields Blank', testRequiredFields);
  await runTest('Duplicate Email/Username', testDuplicateEmail);
  console.log('\nOwner Registration Test Summary:');
  if (failures.length === 0) {
    console.log('All owner registration tests passed!');
  } else {
    failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
    process.exitCode = 1;
  }
})();
