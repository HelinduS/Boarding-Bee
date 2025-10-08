#!/bin/sh
# Run all tests: .NET unit tests and Selenium E2E tests

echo "Running .NET unit tests..."
dotnet test Boarding-Bee.sln

echo "Running Selenium E2E tests..."

node tests/selenium/user-registration.test.js
node tests/selenium/user-login.test.js
node tests/selenium/owner-registration.test.js
node tests/selenium/owner-login.test.js
node tests/selenium/owner-dashboard.test.js
node tests/selenium/tenant-review.test.js

echo "Cleaning up test user..."
echo "Cleaning up owner test user..."
node tests/selenium/delete-test-user.js

