#!/bin/sh

# Run Selenium E2E tests in a specific order with Mocha

# Clean up test users before running tests
echo "Deleting test users before E2E tests..."
node tests/selenium/delete-test-user.js

# Pre-warm the admin auth token used by tests that inject localStorage (Option B)
echo "Ensuring admin token is available for token-injection tests..."
node -e "(async ()=>{ const h=require('./tests/selenium/authHelpers'); try{ await h.ensureAdminToken(); console.log('Admin token prepared'); }catch(e){ console.error('Failed to prepare admin token:', e); process.exitCode=2; } })()"

# Ensure tmp dir exists for created artifacts tracking and set an exit trap to cleanup
mkdir -p ./tmp

cleanup_on_exit() {
  echo "Running on-exit cleanup scripts..."
  # Try to delete listings tracked during tests
  node tests/selenium/delete-created-listings.js || true
  # Run existing cleanup that uses TEST_API_KEY if provided
  node tests/selenium/cleanup-test-listings.js || true
  # Re-run user deletion as a final pass
  node tests/selenium/delete-test-user.js || true
}

trap cleanup_on_exit EXIT



# Run each test file in order, outputting a separate JUnit XML for each
for testfile in \
  tests/selenium/user-registration.test.js \
  tests/selenium/user-login.test.js \
  tests/selenium/owner-registration.test.js \
  tests/selenium/owner-login.test.js \
  tests/selenium/owner-dashboard.test.js \
  tests/selenium/tenant-review.test.js \
  tests/selenium/admin-listings.test.js \
  tests/selenium/admin-tabs-navigation.test.js \
  
do
  base=$(basename "$testfile" .test.js)
  echo "\n===== Running $testfile ====="
  npx mocha "$testfile" \
    --reporter mocha-junit-reporter \
    --reporter-options mochaFile=selenium-results-$base.xml,testsuitesTitle="Selenium E2E: $base"
  # Kill any leftover Chrome/ChromeDriver processes
  pkill chrome || true
  pkill chromedriver || true
  sleep 2
done

# Clean up test users after running tests
echo "Deleting test users after E2E tests..."
node tests/selenium/delete-test-user.js

# Clean up test listings created by E2E runs (requires TEST_API_KEY env var)
echo "Cleaning up test listings..."
node tests/selenium/cleanup-test-listings.js || true
