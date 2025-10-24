/* eslint-disable no-console */
// Deletes the Selenium test users ONLY (keeps e2e_owner/admin intact)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';

// These are your existing Selenium users—KEEP AS-IS
const testUsers = [
  'selenium_test_user@example.com',
  'selenium_owner_test@example.com',
];

// Use the same static admin used in E2E (seeded as ADMIN)
const adminEmail = process.env.ADMIN_EMAIL || 'e2e_admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

async function loginAdmin(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.token) throw new Error('No token in admin login response');
  return json.token;
}

(async function deleteTestUsers() {
  let adminToken = null;
  try {
    adminToken = await loginAdmin(adminEmail, adminPassword);
  } catch (err) {
    console.error('Admin login failed, cannot delete test users:', err.message || err);
    process.exit(1);
  }

  let hadFailure = false;

  for (const email of testUsers) {
    try {
      const res = await fetch(
        `${API_URL}/api/users/delete-by-email?email=${encodeURIComponent(email)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const text = await res.text();

      if (res.ok) {
        console.log('Test user deleted:', email);
        if (text) console.log('Backend response:', text);
      } else {
        // Non-fatal: often user was already gone
        console.warn('Failed to delete test user:', email, `(status ${res.status})`);
        if (text) console.warn('Backend response:', text);
        hadFailure = true;
      }
    } catch (err) {
      console.error('Error deleting test user:', email, err.message || err);
      hadFailure = true;
    }
  }

  // Optional: do not fail the pipeline just because users were already missing.
  // Comment out the next line to make cleanup "best effort" without failing.
  // if (hadFailure) process.exit(1);
})();