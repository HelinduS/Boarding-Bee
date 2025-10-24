const fs = require('fs').promises;
const path = require('path');
const TOKEN_DIR = path.resolve(__dirname, '../../tmp');
const TOKEN_FILE = path.join(TOKEN_DIR, 'e2e-admin-token.txt');
const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) { /* ignore */ }
}

async function registerUser(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  return res;
}

async function loginUser(identifier, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password })
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function ensureAdminToken(user = { username: 'e2e_admin', email: 'e2e_admin@example.com', password: 'AdminPass123!', firstName: 'Admin', lastName: 'E2E', userType: 'admin', role: 'ADMIN' }) {
  await ensureDir(TOKEN_DIR);
  // If token file exists, return it
  try {
    const existing = await fs.readFile(TOKEN_FILE, 'utf8');
    if (existing && existing.trim()) return existing.trim();
  } catch (e) {
    // continue to ensure
  }

  const body = { ...user, phoneNumber: '1234567890', permanentAddress: 'addr', gender: 'other', emergencyContact: '0987654321', institutionCompany: '', location: '' };
  try {
    const reg = await registerUser(body);
    let login;
    if (!reg.ok) {
      login = await loginUser(user.email, user.password);
      if (!login.ok || !login.json || !login.json.token) throw new Error(`login failed for existing admin (status ${login.status})`);
    } else {
      login = await loginUser(user.email, user.password);
      if (!login.ok || !login.json || !login.json.token) throw new Error(`login after register failed (status ${login.status})`);
    }
    const token = login.json.token;
    await fs.writeFile(TOKEN_FILE, token, 'utf8');
    return token;
  } catch (e) {
    throw e;
  }
}

async function getSavedAdminToken() {
  try {
    const t = await fs.readFile(TOKEN_FILE, 'utf8');
    return t && t.trim();
  } catch (e) {
    return null;
  }
}

async function injectTokenToDriver(driver, token, baseUrl = process.env.BASE_URL || 'http://localhost:3000') {
  if (!token) throw new Error('No token provided to inject');
  // Navigate to origin so localStorage is available for that origin
  await driver.get(baseUrl);
  // Set token under multiple keys (some frontends use different names). Keep automation safe by trying common keys.
  await driver.executeScript(function(t){
    try { window.localStorage.setItem('token', t); } catch(e){}
    try { window.localStorage.setItem('authToken', t); } catch(e){}
    try { window.localStorage.setItem('jwt', t); } catch(e){}
    try { window.localStorage.setItem('Authorization', 'Bearer ' + t); } catch(e){}
  }, token);
}

module.exports = { ensureAdminToken, getSavedAdminToken, injectTokenToDriver, TOKEN_FILE };
