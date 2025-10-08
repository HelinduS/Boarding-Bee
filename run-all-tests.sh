#!/bin/sh
# Run all tests: .NET unit tests and Selenium E2E tests

echo "Running .NET unit tests..."
dotnet test Boarding-Bee.sln

echo "Running Selenium E2E tests..."

for test in \
	user-registration.test.js \
	user-login.test.js \
	owner-registration.test.js \
	owner-login.test.js \
	owner-dashboard.test.js \
	tenant-review.test.js
do
	echo "\n--- Running $test ---"
	pkill chrome || true
	node tests/selenium/$test
	sleep 2
done

echo "Cleaning up test user..."
echo "Cleaning up owner test user..."
node tests/selenium/delete-test-user.js

