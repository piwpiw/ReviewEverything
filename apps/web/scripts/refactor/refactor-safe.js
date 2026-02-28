const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

function fixCampaignDetailImage(filePath) {
  if (!fs.existsSync(filePath)) return { touched: false, reason: "file-missing" };
  let content = fs.readFileSync(filePath, "utf8");
  const before = content;

  if (content.includes("<img ")) {
    content = content.replace(/<img\s+([^>]*?)\/>/g, "<Image $1 />");
  }

  if (!content.includes('import Image from "next/image";')) {
    content = `import Image from \"next/image\";\n${content}`;
  }

  if (content !== before) {
    fs.writeFileSync(filePath, content);
    return { touched: true, reason: "img-updated" };
  }

  return { touched: false, reason: "no-change" };
}

function main() {
  const results = [];

  // Keep auto-fixes intentionally narrow and low risk.
  const campaignDetail = path.join(ROOT, "app", "campaigns", "[id]", "page.tsx");
  results.push({ file: "app/campaigns/[id]/page.tsx", ...fixCampaignDetailImage(campaignDetail) });

  const out = {
    generatedAt: new Date().toISOString(),
    results,
  };

  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports", "refactor-apply.json"), JSON.stringify(out, null, 2));

  console.log("[refactorer] completed");
  for (const item of results) {
    console.log(`- ${item.file}: ${item.reason}`);
  }
}

main();
