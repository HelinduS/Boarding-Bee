#!/bin/sh

# Run Selenium E2E tests in a specific order with Mocha

# Clean up test users before running tests
echo "Deleting test users before E2E tests..."
node tests/selenium/delete-test-user.js



# Run each test file in order, outputting a separate JUnit XML for each
for testfile in \
  tests/selenium/user-registration.test.js \
  tests/selenium/user-login.test.js \
  tests/selenium/owner-registration.test.js \
  tests/selenium/owner-login.test.js \
  tests/selenium/owner-dashboard.test.js \
  tests/selenium/tenant-review.test.js \
  tests/selenium/admin-listings.test.js \
  tests/selenium/admin-tabs-navigation.test.js
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
