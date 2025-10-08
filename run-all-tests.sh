#!/bin/sh
# Run all tests: .NET unit tests and Selenium E2E tests

echo "Running .NET unit tests..."
dotnet test Boarding-Bee.sln

echo "Running Selenium E2E tests..."

# Create a unique temp directory for each test to avoid using the same user data dir
for test in \
	user-registration.test.js \
	user-login.test.js \
	owner-registration.test.js \
	owner-login.test.js \
	owner-dashboard.test.js \
	tenant-review.test.js
do
  echo "\n--- Running $test ---"
  
  # Create a unique user data directory for each test
  USER_DATA_DIR=$(mktemp -d /tmp/chrome-user-data-XXXXXX)
  echo "Using Chrome user data dir: $USER_DATA_DIR"

  # Kill any existing chrome processes to avoid clashes
  pkill chrome || true

  # Run the test with the unique user data dir
  node tests/selenium/$test --user-data-dir=$USER_DATA_DIR
  
  # Sleep to ensure the test completes before starting the next one
  sleep 2

  # Clean up the user data directory after the test
  rm -rf "$USER_DATA_DIR"
done

echo "Cleaning up test user..."
node tests/selenium/delete-test-user.js

