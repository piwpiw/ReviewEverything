#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const DOCS_API = path.join(ROOT, "docs", "API.md");
const APP_API_DIR = path.join(ROOT, "app", "api");
const REPORT_DIR = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORT_DIR, "api-contract-audit.md");

function normalizeRoute(raw) {
  const match = raw.match(/(\/api\/[A-Za-z0-9._:-]+(?:\/[A-Za-z0-9._:\-\[\]]+)*)/);
  if (!match) return null;

  return match[1]
    .replace(/\/\[/g, "/:")
    .replace(/\]/g, "")
    .split("?")[0]
    .trim();
}

function sectionFromLine(line) {
  if (line.toLowerCase().includes("implemented") || line.includes("구현")) {
    return "implemented";
  }
  if (line.toLowerCase().includes("planned") || line.includes("미구현")) {
    return "planned";
  }
  return null;
}

function collectDocsRoutes() {
  const text = fs.readFileSync(DOCS_API, "utf8").split(/\r?\n/);
  const state = {
    implemented: new Set(),
    planned: new Set(),
  };
  const internalCandidates = new Set();
  let current = null;
  const routeLineRegex = /`[^`]*?(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)\s+(\/api\/[^`\\s]+)|`(\/api\/[^`\\s]+)/g;

  for (const line of text) {
    const headingState = sectionFromLine(line);
    if (headingState) current = headingState;

    let match;
    while ((match = routeLineRegex.exec(line)) !== null) {
      const methodRoute = match[1] ? match[2] : match[3];
      const route = normalizeRoute(methodRoute);
      if (!route || !route.startsWith("/api/")) continue;

      if (current === "implemented") state.implemented.add(route);
      if (current === "planned") state.planned.add(route);

      if (route === "/api/jobs" && line.includes("내부")) {
        internalCandidates.add(route);
      }
    }
  }

  return {
    implemented: state.implemented,
    planned: state.planned,
    internalCandidates,
  };
}

function collectActualRoutes() {
  const routes = new Set();

  function walk(dir, segments) {
    if (!fs.existsSync(dir)) return;

    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, [...segments, name]);
      } else if (stat.isFile() && name === "route.ts") {
        const routeSeg = segments.map((seg) => seg.replace(/^\[(.+)\]$/, ":$1"));
        if (routeSeg.length > 1) {
          const route = `/api/${routeSeg.slice(1).join("/")}`;
          routes.add(route);
        } else if (routeSeg.length === 1) {
          routes.add("/api");
        }
      }
    }
  }

  walk(APP_API_DIR, ["app", "api"]);
  routes.delete("/app");
  routes.delete("/api");
  return routes;
}

function makeReportLine(category, route, reason, severity = "FAIL") {
  return `- [${severity}] ${category}: ${route} (${reason})`;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const docs = collectDocsRoutes();
  const actual = collectActualRoutes();

  const failures = [];
  const warnings = [];

  const implemented = Array.from(docs.implemented);
  const planned = Array.from(docs.planned);
  const documentedUnion = new Set([...implemented, ...planned]);

  for (const route of actual) {
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
    failures.push(makeReportLine("PUBLIC_JOBS_RISK", "/api/jobs", "Must remain internal and documented as internal trigger"));
  }
  if (docs.planned.has("/api/jobs")) {
    if (!docs.internalCandidates.has("/api/jobs")) {
      warnings.push(makeReportLine("PLANNED_JOBS_CLARITY", "/api/jobs", "Planned route should clearly state internal execution candidate", "WARN"));
    }
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
  for (const route of implemented.sort()) report.push(`- ${route}`);
  report.push("");
  report.push("## Planned routes from API.md");
  for (const route of planned.sort()) report.push(`- ${route}`);
  report.push("");
  report.push("## Actual routes from app/api");
  for (const route of [...actual].sort()) report.push(`- ${route}`);

  fs.writeFileSync(OUTPUT, `${report.join("\n")}\n`);
  console.log(`api contract audit -> ${OUTPUT}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();

