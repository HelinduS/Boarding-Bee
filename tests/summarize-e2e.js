// summarize-e2e.js
// Reads e2e-summary.txt and generates a styled HTML summary (e2e-summary.html)
// Usage: node summarize-e2e.js

const fs = require('fs');
const path = require('path');

const INPUT = 'e2e-summary.txt';
const OUTPUT = 'TestResultsReport/index.html';
const UNIT_HTML = 'test-results.html'; // Path to unit test HTML

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function colorize(line) {
  if (/✔|happy path passed|successful|appears in dashboard|passed\./i.test(line)) {
    return `<span style="color:green;font-weight:bold">${escapeHtml(line)}</span>`;
  }
  if (/✘|failed|error|did not persist|No .* error shown/i.test(line)) {
    return `<span style="color:red;font-weight:bold">${escapeHtml(line)}</span>`;
  }
  if (/skipping|info|ℹ/i.test(line)) {
    return `<span style="color:orange">${escapeHtml(line)}</span>`;
  }
  if (/===== Running/i.test(line)) {
    return `<h3 style="margin-top:1.5em;color:#333">${escapeHtml(line.replace(/=+/g, ''))}</h3>`;
  }
  if (/Test Summary:/i.test(line)) {
    return `<b>${escapeHtml(line)}</b>`;
  }
  return escapeHtml(line);
}

function generateHtmlReport(lines) {
  const summaryLines = lines.filter(l => /✔|✘|failed|passed|error|Test Summary:/i.test(l));
  const total = summaryLines.length;
  const passed = summaryLines.filter(l => /✔|passed/i.test(l)).length;
  const failed = summaryLines.filter(l => /✘|failed|error/i.test(l)).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>E2E Test Summary</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fafbfc; color: #222; margin: 0; padding: 2em; }
    .summary-table { margin-bottom: 2em; border-collapse: collapse; }
    .summary-table th, .summary-table td { border: 1px solid #ccc; padding: 0.5em 1em; }
    .summary-table th { background: #f0f0f0; }
    h1 { color: #2c3e50; }
    h3 { border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
    pre { background: #f6f8fa; padding: 1em; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>End-to-End Test Summary</h1>
  <table class="summary-table">
    <tr><th>Total Checks</th><th>Passed</th><th>Failed</th></tr>
    <tr><td>${total}</td><td style="color:green">${passed}</td><td style="color:red">${failed}</td></tr>
  </table>
  <div>
    ${lines.map(colorize).join('<br>')}
  </div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Input file not found: ${INPUT}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(INPUT, 'utf-8').split(/\r?\n/);
  let html = generateHtmlReport(lines);

  // If unit test HTML exists, append it as a section
  if (fs.existsSync(UNIT_HTML)) {
    const unitHtmlRaw = fs.readFileSync(UNIT_HTML, 'utf-8');
    // Extract <body> contents from unitHtmlRaw
    const match = unitHtmlRaw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const unitBody = match ? match[1] : unitHtmlRaw;
    // Insert before </body> in main html
    html = html.replace(/<\/body>\s*<\/html>\s*$/i,
      `<hr><h1>Unit Test Results</h1>\n<div>${unitBody}</div>\n</body></html>`);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html);
  console.log(`HTML summary written to ${OUTPUT}`);
}

main();