// Runs in the same Mocha process; cleans up between tests.
afterEach(async function () {
  // If you have a global driver, quit it here:
  if (global.driver) {
    try { await global.driver.quit(); } catch (e) {}
    global.driver = null;
  }

  // Fallback cleanup (keeps your previous behavior)
  const { execSync } = require('child_process');
  try { execSync('pkill chrome || true'); } catch (e) {}
  try { execSync('pkill chromedriver || true'); } catch (e) {}
});