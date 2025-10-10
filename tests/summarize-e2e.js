// summarize-e2e.js
// Reads e2e-summary.txt and generates a styled HTML summary (e2e-summary.html)
// Usage: node summarize-e2e.js

const fs = require('fs');
const path = require('path');

const INPUT = 'e2e-summary.txt';
const OUTPUT = 'TestResultsReport/index.html';
const UNIT_SUMMARY = 'unit-summary.txt'; // Path to unit test plain text output

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

  // If unit test summary exists, append it as a section

  if (fs.existsSync(UNIT_SUMMARY)) {
    const unitLines = fs.readFileSync(UNIT_SUMMARY, 'utf-8').split(/\r?\n/);
    // Extract summary line (Passed! - ...)
    const summaryLine = unitLines.find(l => /Passed!\s*-\s*Failed:/i.test(l));
    // Extract warnings
    const warningLines = unitLines.filter(l => /warning|warn|error|CS\d{4}|NU\d{4}/i.test(l));
    // Everything else (build output, etc.)
    const otherLines = unitLines.filter(l => l && l !== summaryLine && !warningLines.includes(l));

    // Extract test case results (works for xUnit and MSTest)
    // Example: [xUnit.net 00:00:01.234]   Passed MyNamespace.MyTestClass.MyTestMethod [1 ms]
    // Example: [xUnit.net 00:00:01.234]   Failed MyNamespace.MyTestClass.MyFailingTest [2 ms]
    const testCaseRegex = /\s+(Passed|Failed|Skipped)\s+([\w.]+)\s*\[(\d+\s*ms|[\d.]+\s*s)\]/i;
    const testCases = unitLines
      .map(l => {
        const m = l.match(testCaseRegex);
        if (m) {
          return {
            result: m[1],
            name: m[2],
            duration: m[3],
            raw: l
          };
        }
        return null;
      })
      .filter(Boolean);

    // Try to extract error messages for failed tests
    let errorMap = {};
    let lastFail = null;
    unitLines.forEach((l) => {
      const failMatch = l.match(/Failed\s+([\w.]+)/);
      if (failMatch) {
        lastFail = failMatch[1];
        errorMap[lastFail] = '';
      } else if (lastFail && l.trim() && !l.match(testCaseRegex)) {
        errorMap[lastFail] += (errorMap[lastFail] ? '\n' : '') + l.trim();
      } else if (!l.trim()) {
        lastFail = null;
      }
    });

    let summaryHtml = '';
    if (summaryLine) {
      const failedMatch = summaryLine.match(/Failed:\s*(\d+)/i);
      const failedCount = failedMatch ? parseInt(failedMatch[1], 10) : 0;
      summaryHtml = `<div style="font-size:1.2em;font-weight:bold;color:${failedCount === 0 ? 'green' : 'red'};margin-bottom:0.5em;">${escapeHtml(summaryLine)}</div>`;
    }

    // Business-friendly test case table
    let tableHtml = '';
    if (testCases.length) {
      tableHtml = `<table style="border-collapse:collapse;margin-bottom:1em;"><thead><tr><th style="border:1px solid #ccc;padding:4px 8px;">Test Name</th><th style="border:1px solid #ccc;padding:4px 8px;">Result</th><th style="border:1px solid #ccc;padding:4px 8px;">Duration</th><th style="border:1px solid #ccc;padding:4px 8px;">Error</th></tr></thead><tbody>`;
      for (const tc of testCases) {
        const color = tc.result === 'Passed' ? 'green' : tc.result === 'Failed' ? 'red' : 'orange';
        const icon = tc.result === 'Passed' ? '✅' : tc.result === 'Failed' ? '❌' : '⚠️';
        const error = tc.result === 'Failed' && errorMap[tc.name] ? `<pre style="color:red;font-size:0.95em;white-space:pre-wrap;">${escapeHtml(errorMap[tc.name])}</pre>` : '';
        tableHtml += `<tr><td style="border:1px solid #ccc;padding:4px 8px;">${escapeHtml(tc.name)}</td><td style="border:1px solid #ccc;padding:4px 8px;color:${color};font-weight:bold;">${icon} ${tc.result}</td><td style="border:1px solid #ccc;padding:4px 8px;">${escapeHtml(tc.duration)}</td><td style="border:1px solid #ccc;padding:4px 8px;">${error}</td></tr>`;
      }
      tableHtml += '</tbody></table>';
    }

    let warningsHtml = '';
    if (warningLines.length) {
      warningsHtml = `<details style="margin-bottom:0.5em;"><summary style="color:orange;font-weight:bold;">Show Warnings & Build Output</summary><pre style="font-size:0.95em;color:#b8860b;">${warningLines.map(escapeHtml).join('\n')}</pre></details>`;
    }

    let otherHtml = '';
    if (otherLines.length) {
      otherHtml = `<details><summary>Show Full Unit Test Log</summary><pre style="font-size:0.95em;">${otherLines.map(escapeHtml).join('\n')}</pre></details>`;
    }

    html = html.replace(/<\/body>\s*<\/html>\s*$/i,
      `<hr><h1>Unit Test Results</h1>\n${summaryHtml}${tableHtml}${warningsHtml}${otherHtml}\n</body></html>`);
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html);
  console.log(`HTML summary written to ${OUTPUT}`);
}

main();