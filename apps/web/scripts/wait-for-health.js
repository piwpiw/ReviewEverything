#!/usr/bin/env node

const DEFAULT_PATH = '/api/health';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_OK_MIN = 200;
const DEFAULT_OK_MAX = 399;

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function clampRange(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return Math.floor(parsed);
}

function toHealthUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith(DEFAULT_PATH)) {
    return trimmed;
  }
  return `${trimmed}${DEFAULT_PATH}`;
}

function resolveHealthUrl() {
  const explicit = process.env.HEALTHCHECK_URL;
  if (explicit) return explicit;

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.CRON_BASE_URL,
  ].filter(Boolean);

  if (candidates.length === 0) return '';
  return toHealthUrl(candidates[0]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const healthUrl = resolveHealthUrl();
  if (!healthUrl) {
    console.log('[wait-for-health] HEALTHCHECK_URL or NEXT_PUBLIC_* base URL is not set. Skipping.');
    process.exit(0);
  }

  const timeoutSec = toPositiveInt(process.env.HEALTHCHECK_TIMEOUT_SEC, 300);
  const intervalSec = toPositiveInt(process.env.HEALTHCHECK_INTERVAL_SEC, 10);
  const fetchTimeoutMs = clampRange(process.env.HEALTHCHECK_FETCH_TIMEOUT_MS, 500, 60000, DEFAULT_TIMEOUT_MS);
  const statusMin = clampRange(process.env.HEALTHCHECK_OK_STATUS_MIN, DEFAULT_OK_MIN, 399, DEFAULT_OK_MIN);
  const statusMax = clampRange(process.env.HEALTHCHECK_OK_STATUS_MAX, 200, 599, DEFAULT_OK_MAX);
  const maxAttempts = Math.max(1, Math.ceil(timeoutSec / intervalSec));

  console.log(`[wait-for-health] polling ${healthUrl}`);
  console.log(
    `[wait-for-health] timeout=${timeoutSec}s interval=${intervalSec}s attempts=${maxAttempts} fetchTimeout=${fetchTimeoutMs}ms status=${statusMin}-${statusMax}`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let controller;
    let timer;

    try {
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), fetchTimeoutMs);
      const response = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      const status = response.status;

      if (status >= statusMin && status <= statusMax) {
        console.log(`[wait-for-health] healthy on attempt ${attempt} (status ${status})`);
        process.exit(0);
      }

      const body = await response.text();
      console.log(`[wait-for-health] attempt ${attempt}/${maxAttempts} not ready (status ${status}) ${body.slice(0, 120)}`);
    } catch (error) {
      console.log(`[wait-for-health] attempt ${attempt}/${maxAttempts} failed: ${error?.message || String(error)}`);
    } finally {
      if (timer) clearTimeout(timer);
      if (controller) controller.abort?.();
    }

    if (attempt < maxAttempts) {
      await sleep(intervalSec * 1000);
    }
  }

  console.error(`[wait-for-health] failed after ${maxAttempts} attempts`);
  process.exit(1);
}

run().catch((error) => {
  console.error(`[wait-for-health] unexpected error: ${error?.message || String(error)}`);
  process.exit(1);
});
