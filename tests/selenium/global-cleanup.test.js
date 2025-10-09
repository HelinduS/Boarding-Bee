// tests/selenium/global-cleanup.test.js
const { execSync } = require('child_process');

after(function () {
  console.log('Global cleanup: Deleting test users...');
  try {
    execSync('node tests/selenium/delete-test-user.js', { stdio: 'inherit' });
  } catch (e) {
    console.error('Global cleanup failed:', e);
  }
});