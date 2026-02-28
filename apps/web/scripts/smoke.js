const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const REPORT_FILE = path.join(REPORT_DIR, "smoke.json");

function withHttps(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

async function probe(baseUrl, endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "revieweverything-smoke/1.0" },
    });

    const status = response.status;
    const ok = endpoint === "/api/health"
      ? status === 200 || status === 503
      : status >= 200 && status < 400;

    return { endpoint, status, ok };
  } catch (error) {
    return { endpoint, status: 0, ok: false, error: error instanceof Error ? error.message : "unknown-error" };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const baseUrl = withHttps(process.env.SMOKE_BASE_URL || process.env.VERCEL_URL || "");
  if (!baseUrl) {
    const skipped = {
      generatedAt: new Date().toISOString(),
      skipped: true,
      reason: "SMOKE_BASE_URL_OR_VERCEL_URL_NOT_SET",
      checks: [],
    };
    fs.writeFileSync(REPORT_FILE, JSON.stringify(skipped, null, 2));
    console.log("[smoke] skipped: set SMOKE_BASE_URL (or VERCEL_URL) to enable smoke checks");
    return;
  }

  const endpoints = ["/", "/campaigns", "/admin", "/api/health"];
  const checks = [];

  for (const endpoint of endpoints) {
    checks.push(await probe(baseUrl, endpoint));
  }

  const failed = checks.filter((item) => !item.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    skipped: false,
    baseUrl,
    checks,
    failedCount: failed.length,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  if (failed.length > 0) {
    console.error("[smoke] failed endpoints:", failed.map((x) => x.endpoint).join(", "));
    process.exit(1);
  }

  console.log("[smoke] all endpoints passed");
}

main();
