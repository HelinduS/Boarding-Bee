// seleniumTestUtils.js
// Shared helpers for robust Chrome/Selenium E2E tests in CI and local

const os = require('os');
const path = require('path');
const fs = require('fs');
const chrome = require('selenium-webdriver/chrome');

function getUniqueUserDataDir(testName) {
}

function getChromeOptions(testName) {
  const userDataDir = path.join(os.tmpdir(), 'selenium-user-data', testName + '-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });
  const options = new chrome.Options()
    .addArguments(`--user-data-dir=${userDataDir}`)
    .addArguments('--no-sandbox', '--disable-dev-shm-usage');
  if (process.env.CI) {
    options.addArguments('--headless=new');
  }
  return options;
}

module.exports = { getChromeOptions };
