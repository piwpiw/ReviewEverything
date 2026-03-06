#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const DOCS_API = path.join(ROOT, "docs", "API.md");
const APP_API_DIR = path.join(ROOT, "app", "api");
const REPORT_DIR = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORT_DIR, "api-contract-audit.md");

function makeReportLine(category, route, reason, severity = "FAIL") {
  return `- [${severity}] ${category}: ${route} (${reason})`;
}

function normalizeRoute(raw) {
  if (!raw) return null;
  let route = String(raw).trim();

  route = route.replace(/^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)\s+/i, "");
  route = route.split("?")[0];
  route = route.replace(/\[([^\]]+)\]/g, ":$1");
  route = route.replace(/\/{2,}/g, "/");
  route = route.replace(/[`'"),.;:!]+$/g, "");

  if (!route.startsWith("/api/")) return null;
  return route;
}

function inferSection(line) {
  const text = line.toLowerCase();
  if (/^##+\s+.*implemented/.test(text)) return "implemented";
  if (/^##+\s+.*planned/.test(text)) return "planned";
  if (text.includes("implemented public endpoints")) return "implemented";
  if (text.includes("planned /")) return "planned";
  return null;
}

function collectDocsRoutes() {
  const lines = fs.readFileSync(DOCS_API, "utf8").split(/\r?\n/);
  const implemented = new Set();
  const planned = new Set();
  const internalCandidates = new Set();
  const routeRx = /\/api\/[A-Za-z0-9._~:%@+\-/\[\]]+/g;
  let current = null;

  for (const line of lines) {
    const section = inferSection(line);
    if (section) current = section;

    routeRx.lastIndex = 0;
    let match = routeRx.exec(line);
    while (match !== null) {
      const route = normalizeRoute(match[0]);
      if (route) {
        if (current === "implemented") implemented.add(route);
        if (current === "planned") planned.add(route);
        if (route === "/api/jobs" && /(internal|cron_secret)/i.test(line)) {
          internalCandidates.add(route);
        }
      }
      match = routeRx.exec(line);
    }
  }

  return { implemented, planned, internalCandidates };
}

function collectActualRoutes() {
  const routes = new Set();

  function walk(dir, relative) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, [...relative, entry.name]);
        continue;
      }

      if (!entry.isFile() || entry.name !== "route.ts") continue;

      const routeParts = relative.map((seg) => seg.replace(/^\[(.+)\]$/, ":$1"));
      const route = routeParts.length > 0 ? `/api/${routeParts.join("/")}` : "/api";
      routes.add(route);
    }
  }

  walk(APP_API_DIR, []);
  routes.delete("/api");
  return routes;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const docs = collectDocsRoutes();
  const actual = collectActualRoutes();

  const failures = [];
  const warnings = [];

  const implemented = [...docs.implemented].sort();
  const planned = [...docs.planned].sort();
  const documentedUnion = new Set([...implemented, ...planned]);

  for (const route of [...actual].sort()) {
    if (!documentedUnion.has(route)) {
      failures.push(makeReportLine("UNTRACKED_ROUTE", route, "Actual route exists but not in API.md implemented/planned"));
    }
  }

  for (const route of implemented) {
    if (!actual.has(route)) {
      failures.push(makeReportLine("STALE_IMPLEMENTED", route, "Documented implemented route is missing in app/api"));
    }
  }

  const overlap = implemented.filter((route) => docs.planned.has(route));
  for (const route of overlap) {
    failures.push(makeReportLine("OVERLAP_LABEL", route, "Route is marked both implemented and planned"));
  }

  if (docs.implemented.has("/api/jobs") && !docs.internalCandidates.has("/api/jobs")) {
    warnings.push(makeReportLine("PUBLIC_JOBS_RISK", "/api/jobs", "Document this route as internal trigger", "WARN"));
  }

  const report = [];
  report.push("# API Contract Audit Report");
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push(`- Actual routes: ${actual.size}`);
  report.push(`- Implemented routes in docs: ${implemented.length}`);
  report.push(`- Planned routes in docs: ${planned.length}`);
  report.push(`- Result: ${failures.length === 0 ? "PASS" : "FAIL"}`);
  report.push("");

  if (failures.length > 0) {
    report.push("## Failures");
    report.push(...failures);
    report.push("");
  }

  if (warnings.length > 0) {
    report.push("## Warnings");
    report.push(...warnings);
    report.push("");
  }

  report.push("## Implemented routes from API.md");
  for (const route of implemented) report.push(`- ${route}`);
  report.push("");

  report.push("## Planned routes from API.md");
  for (const route of planned) report.push(`- ${route}`);
  report.push("");

  report.push("## Actual routes from app/api");
  for (const route of [...actual].sort()) report.push(`- ${route}`);

  fs.writeFileSync(OUTPUT, `${report.join("\n")}\n`, "utf8");
  console.log(`api contract audit -> ${OUTPUT}`);

  if (failures.length > 0) process.exit(1);
}

main();