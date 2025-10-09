// send-report.js
// Node.js script to fetch contributors, convert HTML to PDF, and email PDF to all contributors
// Requires: nodemailer, node-fetch, wkhtmltopdf, dotenv

const fs = require('fs');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;
const REPORT_HTML_PATH = process.env.REPORT_HTML_PATH || 'TestResultsReport/index.html';
const REPORT_PDF_PATH = process.env.REPORT_PDF_PATH || 'TestResultsReport/report.pdf';

async function getContributorsEmails() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors`;
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
  });
  const contributors = await res.json();
  const emails = new Set();
  for (const user of contributors) {
    // Fetch user details for email
    const userRes = await fetch(user.url, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const userDetails = await userRes.json();
    if (userDetails.email && !userDetails.email.includes('noreply')) {
      emails.add(userDetails.email);
    }
  }
  // Always include helindusenadheera@gmail.com
  emails.add('helindusenadheera@gmail.com');
  return Array.from(emails);
}

function convertHtmlToPdf(htmlPath, pdfPath) {
  // Requires wkhtmltopdf installed
  execSync(`wkhtmltopdf ${htmlPath} ${pdfPath}`);
}

async function sendEmail(recipients, pdfPath) {
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  let info = await transporter.sendMail({
    from: SMTP_FROM,
    to: recipients.join(','),
    subject: 'Automated Test Report',
    text: 'Please find the attached PDF test report.',
    attachments: [
      {
        filename: 'report.pdf',
        path: pdfPath
      }
    ]
  });
  console.log('Email sent:', info.messageId);
}

(async () => {
  try {
    const emails = await getContributorsEmails();
    if (!emails.length) throw new Error('No contributor emails found.');
    convertHtmlToPdf(REPORT_HTML_PATH, REPORT_PDF_PATH);
    await sendEmail(emails, REPORT_PDF_PATH);
    console.log('Report sent to:', emails);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
