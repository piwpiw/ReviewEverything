const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const REPORT_DIR = path.join(ROOT, "reports");
const EXCLUDED_DIRS = new Set(["node_modules", ".next", ".vercel", ".git"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        walk(path.join(dir, entry.name), files);
      }
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function toPosix(file) {
  return file.replace(/\\/g, "/");
}

function detectAny(content, file) {
  const results = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/(:\s*any\b)|(\bas\s+any\b)|(<any>)/.test(line)) {
      results.push({ file: toPosix(path.relative(ROOT, file)), line: idx + 1, rule: "any-usage", text: line.trim() });
    }
  });
  return results;
}

function detectImg(content, file) {
  const results = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/<img\s/i.test(line)) {
      results.push({ file: toPosix(path.relative(ROOT, file)), line: idx + 1, rule: "no-img-element", text: line.trim() });
    }
  });
  return results;
}

function detectEncoding(content, file) {
  const results = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.includes("\uFFFD") || /[?]{3,}/.test(line)) {
      results.push({ file: toPosix(path.relative(ROOT, file)), line: idx + 1, rule: "encoding-risk", text: line.trim().slice(0, 200) });
    }
  });
  return results;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const sourceFiles = walk(path.join(ROOT, "app"))
    .concat(walk(path.join(ROOT, "components")))
    .concat(walk(path.join(ROOT, "lib")))
    .concat(walk(path.join(ROOT, "sources")))
    .concat(walk(path.join(ROOT, "tests")));

  const findings = [];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    findings.push(...detectAny(content, file));
    findings.push(...detectImg(content, file));
    findings.push(...detectEncoding(content, file));
  }

  const byRule = findings.reduce((acc, finding) => {
    acc[finding.rule] = (acc[finding.rule] || 0) + 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    totalFindings: findings.length,
    byRule,
    findings,
  };

  fs.writeFileSync(path.join(REPORT_DIR, "refactor-analysis.json"), JSON.stringify(report, null, 2));

  console.log("[analyzer] findings:", report.totalFindings);
  for (const [rule, count] of Object.entries(byRule)) {
    console.log(`- ${rule}: ${count}`);
  }
}

main();
