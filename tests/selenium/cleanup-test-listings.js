const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';
const TEST_KEY = process.env.TEST_API_KEY;
const PREFIX = process.env.TEST_LISTING_PREFIX || 'E2E';

async function run() {
  if (!TEST_KEY) {
    console.error('TEST_API_KEY not set - skipping cleanup');
    process.exit(1);
  }
  const res = await fetch(`${API_URL}/api/listings/test/cleanup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TEST-KEY': TEST_KEY
    },
    body: JSON.stringify({ prefix: PREFIX })
  });
  const txt = await res.text();
  try { console.log('Cleanup response:', JSON.parse(txt)); } catch (e) { console.log('Cleanup raw:', txt); }
}

run().catch(err => { console.error(err); process.exit(2); });
