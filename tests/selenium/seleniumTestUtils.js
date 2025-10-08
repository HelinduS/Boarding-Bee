// seleniumTestUtils.js
// Shared helpers for robust Chrome/Selenium E2E tests in CI and local
const os = require('os');
const path = require('path');
const fs = require('fs');

function getBaseUserDataDir() {
  const arg = process.argv.find(a => a.startsWith('--user-data-dir='));
  if (arg) {
    const dir = arg.split('=')[1];
    if (dir) return dir;
  }
  // Use /dev/shm in CI if available, else $HOME, else /tmp
  let baseTmp = os.tmpdir();
  if (process.env.CI && fs.existsSync('/dev/shm')) {
    baseTmp = '/dev/shm';
  } else if (process.env.CI) {
    baseTmp = process.env.HOME || os.homedir();
  }
  return fs.mkdtempSync(path.join(baseTmp, 'chrome-user-data-'));
}

function getUniqueUserDataDir(testName) {
  const baseDir = getBaseUserDataDir();
  const uniqueDir = path.join(baseDir, `${testName}-${Math.random().toString(36).slice(2, 10)}`);
  if (fs.existsSync(uniqueDir)) {
    fs.rmSync(uniqueDir, { recursive: true, force: true });
  }
  fs.mkdirSync(uniqueDir, { recursive: true });
  return uniqueDir;
}

function getChromeOptions(userDataDir, chrome) {
  return new chrome.Options()
    .addArguments(`--user-data-dir=${userDataDir}`)
    .addArguments('--no-sandbox', '--disable-dev-shm-usage', '--headless=new');
}

module.exports = { getBaseUserDataDir, getUniqueUserDataDir, getChromeOptions };
