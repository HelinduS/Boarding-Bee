// send-report.js
// Fetch contributors, render HTML -> PDF, and email the PDF to contributors.
// Requires: nodemailer, node-fetch, dotenv (and wkhtmltopdf installed on the runner)

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
require('dotenv').config();

const {
  GITHUB_TOKEN,
  REPO_OWNER,
  REPO_NAME,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  REPORT_HTML_PATH = 'TestResultsReport/index.html',
  REPORT_PDF_PATH = 'TestResultsReport/report.pdf',
  TEAM_EMAILS, // optional: comma-separated fallback list
} = process.env;

// --- GitHub helpers ---------------------------------------------------------

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'send-report-script',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} for ${url}: ${body}`);
  }
  return res.json();
}

async function getContributorsEmails() {
  const emails = new Set();

  // Paginate contributors (per_page=100)
  let page = 1;
  while (true) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=100&page=${page}`;
    const contributors = await fetchJson(url);
    if (!Array.isArray(contributors) || contributors.length === 0) break;

    // For each contributor, fetch user profile to check public email
    for (const user of contributors) {
      try {
        const userDetails = await fetchJson(user.url);
        const em = userDetails.email;
        if (em && !String(em).includes('noreply')) emails.add(em);
      } catch {
        // ignore individual lookup failures
      }
    }

    page += 1;
  }

  // Optional fallback list from env
  if (TEAM_EMAILS) {
    TEAM_EMAILS.split(',').map(s => s.trim()).filter(Boolean).forEach(e => emails.add(e));
  }

  // Always include Helindu (as you requested)
  emails.add('helindusenadheera@gmail.com');

  return Array.from(emails);
}

// --- PDF conversion (wkhtmltopdf, CI-safe flags) ----------------------------

function convertHtmlToPdf(htmlPath, pdfPath) {
  const projectRoot = process.cwd();
  const inHtml = path.resolve(projectRoot, htmlPath);
  const outPdf = path.resolve(projectRoot, pdfPath);

  if (!fs.existsSync(inHtml)) {
    throw new Error(`HTML not found at ${inHtml}`);
  }
  fs.mkdirSync(path.dirname(outPdf), { recursive: true });

  // Use xvfb-run for headless CI, enable local file access, and ignore 'about:' load errors.
  const cmd =
    `xvfb-run -a wkhtmltopdf ` +
    `--enable-local-file-access ` +
    `--allow "${projectRoot}" ` +
    `--load-error-handling ignore ` +
    `--no-stop-slow-scripts ` +
    `--javascript-delay 1500 ` +
    `"${inHtml}" "${outPdf}"`;

  execSync(cmd, { stdio: 'inherit' });
}

// --- Email ------------------------------------------------------------------

async function sendEmail(recipients, pdfPath) {
  const portNum = Number(SMTP_PORT) || 587;
  const secure = portNum === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Use BCC to avoid exposing addresses to each other
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to: SMTP_FROM,
    bcc: recipients,
    subject: 'Automated Test Report',
    text: 'Please find the attached PDF test report.',
    attachments: [{ filename: 'report.pdf', path: pdfPath }],
  });

  console.log('Email sent:', info.messageId);
}

// --- Main -------------------------------------------------------------------

(async () => {
  try {
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required.');
    const emails = await getContributorsEmails();
    if (!emails.length) throw new Error('No recipient emails found.');

    convertHtmlToPdf(REPORT_HTML_PATH, REPORT_PDF_PATH);
    await sendEmail(emails, REPORT_PDF_PATH);

    console.log('Report sent to:', emails);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();