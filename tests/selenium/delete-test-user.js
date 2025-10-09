
// delete-test-user.js
// Deletes both the regular and owner test users created by Selenium tests
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';
const testUsers = [
  'selenium_test_user@example.com',
  'selenium_owner_test@example.com',
];

(async function deleteTestUsers() {
  let allOk = true;
  for (const email of testUsers) {
    try {
  const res = await fetch(`${API_URL}/api/users/delete-by-email?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const text = await res.text();
      if (res.ok) {
        console.log('Test user deleted:', email);
        console.log('Backend response:', text);
      } else {
        console.warn('Failed to delete test user:', email, text);
        allOk = false;
      }
    } catch (err) {
      console.error('Error deleting test user:', email, err);
      allOk = false;
    }
  }
  if (!allOk) process.exit(1);
})();
