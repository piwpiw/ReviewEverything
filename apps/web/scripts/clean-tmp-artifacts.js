const fs = require("node:fs");
const path = require("node:path");

const tmpDir = path.join(__dirname, "..", "tmp");
const targetExtensions = new Set([".html", ".log"]);
const targetNames = new Set(["revu_bundle.js"]);

const entries = fs.readdirSync(tmpDir, { withFileTypes: true });
const removed = [];
const skipped = [];

for (const entry of entries) {
  if (!entry.isFile()) continue;

  const fileName = entry.name;
  const ext = path.extname(fileName).toLowerCase();
  if (targetExtensions.has(ext) || targetNames.has(fileName)) {
    const fullPath = path.join(tmpDir, fileName);
    try {
      fs.unlinkSync(fullPath);
      removed.push(fileName);
    } catch (error) {
      skipped.push(`${fileName}: ${String(error instanceof Error ? error.message : error)}`);
    }
  }
}

if (removed.length) {
  console.log(`tmp cleanup removed: ${removed.length}`);
  for (const name of removed) console.log(`- ${name}`);
}

if (skipped.length) {
  console.error(`tmp cleanup skipped: ${skipped.length}`);
  for (const message of skipped) console.error(`- ${message}`);
}
