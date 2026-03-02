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

async function probe(baseUrl, { endpoint, method = "GET", body, headers = {}, expect }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const url = `${baseUrl}${endpoint}`;
  let responseBodyJson = null;

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "revieweverything-smoke/1.0",
        ...headers,
      },
      body,
    });

    const status = response.status;
    const responseBody = await response.text().catch(() => "");
    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        responseBodyJson = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        responseBodyJson = null;
      }
    }

    const isDefaultOk =
      endpoint === "/api/health"
        ? status === 200 || status === 503
        : status >= 200 && status < 400;
    const ok = typeof expect === "function" ? expect(status, responseBodyJson) : isDefaultOk;

    return { endpoint, status, ok, responseBody: responseBody ? responseBody.slice(0, 400) : undefined };
  } catch (error) {
    return { endpoint, status: 0, ok: false, error: error instanceof Error ? error.message : "unknown-error" };
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency(items, limit, worker) {
  const safeLimit = Math.max(1, Math.min(limit, items.length || 1));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function consume() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: safeLimit }, () => consume()));
  return results;
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

  const endpoints = [
    "/",
    "/campaigns",
    "/admin",
    "/api/health",
    "/api/me/notifications?userId=1",
    "/api/me/notification-channels",
    {
      endpoint: "/api/me/notifications/test",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: 1,
        channel: "push",
        dryRun: true,
        message: "smoke test notification",
      }),
      expect: (status) => status === 200 || status === 400,
    },
    {
      endpoint: "/api/me/notifications/test",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: 1,
        channel: "kakao",
        dryRun: true,
        message: "smoke test notification",
      }),
      expect: (status) => status === 200 || status === 400,
    },
    {
      endpoint: "/api/me/notifications/test",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: 1,
        channel: "telegram",
        dryRun: true,
        message: "smoke test notification",
      }),
      expect: (status) => status === 200 || status === 400,
    },
    {
      endpoint: "/api/me/notification-channels",
      expect: (_, payload) => {
        const channels = Array.isArray(payload?.channels) ? payload.channels : null;
        return Boolean(channels) && typeof payload.meta?.hasAnyChannel === "boolean";
      },
    },
    {
      endpoint: "/api/me/notification-preferences?userId=1",
      expect: (status, payload) => {
        if (status === 404 || status === 400) return true;
        if (status !== 200 || !payload) return false;
        return ["notify_kakao_enabled", "notify_telegram_enabled", "notify_push_enabled"].every((k) =>
          Object.prototype.hasOwnProperty.call(payload, k),
        );
      },
    },
    {
      endpoint: "/api/me/curation?limit=1",
      expect: (_, payload) => {
        return Array.isArray(payload?.picks);
      },
    },
    {
      endpoint: "/api/me/notifications?userId=1&take=15&status=success&channel=push&days=30",
      expect: (status) => status >= 200 && status < 400,
    },
    {
      endpoint: "/api/me/notifications?userId=1&status=failed&channel=kakao",
      expect: (status) => status >= 200 && status < 400,
    },
    {
      endpoint: "/api/me/notifications?userId=1&channel=all",
      expect: (status) => status >= 200 && status < 400,
    },
    {
      endpoint: "/api/me/notifications?userId=1&status=wrong",
      expect: (status) => status === 400,
    },
  ];
  const requestedConcurrency = Number(process.env.SMOKE_CONCURRENCY || "4");
  const concurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
    ? Math.floor(requestedConcurrency)
    : 4;

  const checks = await runWithConcurrency(endpoints, concurrency, async (endpoint) => {
    if (typeof endpoint === "string") {
      return probe(baseUrl, { endpoint });
    }
    return probe(baseUrl, endpoint);
  });

  const failed = checks.filter((item) => !item.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    skipped: false,
    baseUrl,
    concurrency,
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
