const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const REPORT_DIR = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORT_DIR, "ci-summary.md");

function readIfExists(file) {
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}

function parseEslint(file) {
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const issues = [];
    for (const entry of parsed) {
      for (const message of entry.messages || []) {
        if (message.severity === 2) {
          issues.push({
            file: entry.filePath.replace(/\\/g, "/"),
            line: message.line || 1,
            rule: message.ruleId || "eslint",
            message: message.message,
          });
        }
      }
    }
    return issues;
  } catch {
    return [];
  }
}

function parseTypecheck(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.includes("error TS"))
    .slice(0, 25);
}

function parseSmoke(file) {
  if (!fs.existsSync(file)) return { skipped: true, checks: [] };
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { skipped: true, checks: [] };
  }
}

function parseApiContract(file) {
  if (!fs.existsSync(file)) return { result: "skipped", lines: [] };
  const text = fs.readFileSync(file, "utf8");
  const resultLine = text.match(/- Result:\s*(PASS|FAIL)/i);
  const failureLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- [FAIL]") || line.startsWith("- [WARN]"))
    .slice(0, 20);

  return {
    result: resultLine ? resultLine[1].toUpperCase() : "unknown",
    lines: failureLines,
  };
}

function parseApiSync(file) {
  if (!fs.existsSync(file)) return { result: "skipped", failureLines: [], warningLines: [] };
  const text = fs.readFileSync(file, "utf8");
  const resultLine = text.match(/- Result:\s*(PASS|FAIL)/i);
  const failureLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- [FAIL]"))
    .slice(0, 20);
  const warningLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- [WARN]"))
    .slice(0, 20);

  return {
    result: resultLine ? resultLine[1].toUpperCase() : "unknown",
    failureLines,
    warningLines,
  };
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const eslintIssues = parseEslint(path.join(REPORT_DIR, "eslint.json")).slice(0, 25);
  const typeErrors = parseTypecheck(readIfExists(path.join(REPORT_DIR, "typecheck.txt")));
  const testOutput = readIfExists(path.join(REPORT_DIR, "test_output.txt"));
  const smoke = parseSmoke(path.join(REPORT_DIR, "smoke.json"));
  const apiContract = parseApiContract(path.join(REPORT_DIR, "api-contract-audit.md"));
  const apiSync = parseApiSync(path.join(REPORT_DIR, "api-contract-sync-audit.md"));

  const testFailed = /failed/i.test(testOutput) && !/0 failed/i.test(testOutput);
  const smokeFailed = !smoke.skipped && Array.isArray(smoke.checks) && smoke.checks.some((check) => !check.ok);

  const lines = [];
  lines.push("## CI Gate Summary");
  lines.push("");
  lines.push(`- eslint errors: ${eslintIssues.length}`);
  lines.push(`- typecheck errors: ${typeErrors.length}`);
  lines.push(`- tests failed: ${testFailed ? "yes" : "no"}`);
  lines.push(`- smoke failed: ${smokeFailed ? "yes" : "no"}`);
  lines.push(`- api contract audit: ${apiContract.result}`);
  lines.push(`- api sync audit: ${apiSync.result}`);
  lines.push("");

  if (eslintIssues.length > 0) {
    lines.push("### ESLint Errors");
    for (const issue of eslintIssues) {
      lines.push(`- ${issue.file}:${issue.line} [${issue.rule}] ${issue.message}`);
    }
    lines.push("");
  }

  if (typeErrors.length > 0) {
    lines.push("### Typecheck Errors");
    for (const line of typeErrors) {
      lines.push(`- ${line}`);
    }
    lines.push("");
  }

  if (smokeFailed) {
    lines.push("### Smoke Failures");
    for (const check of smoke.checks.filter((item) => !item.ok)) {
      lines.push(`- ${check.endpoint} status=${check.status} ${check.error ? `error=${check.error}` : ""}`.trim());
    }
    lines.push("");
  }

  if (apiContract.result === "FAIL" && apiContract.lines.length > 0) {
    lines.push("### API Contract Audit Failures");
    for (const line of apiContract.lines) {
      lines.push(line);
    }
    lines.push("");
  }

  if (apiSync.result !== "PASS" && apiSync.failureLines.length > 0) {
    lines.push("### API Sync Audit Issues");
    for (const line of apiSync.failureLines) {
      lines.push(line);
    }
    lines.push("");
  }

  if (apiSync.warningLines.length > 0) {
    lines.push("### API Sync Audit Warnings");
    for (const line of apiSync.warningLines) {
      lines.push(line);
    }
    lines.push("");
  }

  fs.writeFileSync(OUTPUT, lines.join("\n"));
  console.log(lines.join("\n"));
}

main();
