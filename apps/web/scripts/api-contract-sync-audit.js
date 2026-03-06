#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const TEAM_DIR = path.join(DOCS_DIR, "teams");
const APP_API_DIR = path.join(ROOT, "app", "api");
const REPORT_DIR = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORT_DIR, "api-contract-sync-audit.md");

const API_FILE = path.join(DOCS_DIR, "API.md");
const PEER_DOCS = [
  "ARCHITECTURE.md",
  "TEAM_CONTEXT.md",
  "AGENT_WORKFLOW.md",
  "PROJECT_STATUS.md",
  "PROJECT_STATUS_NEXT_ACTIONS.md",
  "SCRAPERS.md",
];

const INTERNAL_EXEMPT_ROUTES = new Set(["/api/jobs"]);
const ROUTE_RX = /\/api\/[A-Za-z0-9._~:%@+\-/\[\]:*]+/gi;

function uniqSorted(values) {
  return [...new Set(values)].sort();
}

function normalizeRoute(rawRoute) {
  if (!rawRoute) return null;

  let route = String(rawRoute).trim();
  route = route.replace(/^(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\s+/i, "");
  route = route.replace(/^[`'"(]+/, "").replace(/[`'"),.;:!]+$/, "");
  route = route.split("?")[0];
  route = route.replace(/\[([^\]]+)\]/g, ":$1");
  route = route.replace(/\/{2,}/g, "/");

  if (!route.startsWith("/api/")) return null;
  if (route.includes("*")) return null;
  return route;
}

function extractRoutes(line) {
  const routes = new Set();
  ROUTE_RX.lastIndex = 0;
  let match = ROUTE_RX.exec(line);

  while (match !== null) {
    const route = normalizeRoute(match[0]);
    if (route) routes.add(route);
    match = ROUTE_RX.exec(line);
  }

  return routes;
}

function inferStatus(line) {
  const text = line.toLowerCase();
  if (/(implemented|implementation|구현)/i.test(text)) return "implemented";
  if (/(planned|roadmap|not implemented|미구현|계획)/i.test(text)) return "planned";
  return null;
}

function parseRoutesFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { implemented: new Set(), planned: new Set(), overlaps: [] };
  }

  const implemented = new Set();
  const planned = new Set();
  const overlaps = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let context = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const statusHint = inferStatus(line);
    const isListLine = /^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    const isHeading = /^#{1,6}\s+/.test(trimmed);

    if (isHeading) {
      context = statusHint;
      continue;
    }

    if (statusHint && !isListLine) {
      context = statusHint;
    }

    const routes = extractRoutes(line);
    if (routes.size === 0) continue;

    const status = statusHint || (isListLine ? context : null);
    if (!status) continue;

    for (const route of routes) {
      if (status === "implemented") {
        if (planned.has(route)) overlaps.push(`${path.basename(filePath)}: ${route} implemented+planned`);
        implemented.add(route);
      } else {
        if (implemented.has(route)) overlaps.push(`${path.basename(filePath)}: ${route} planned+implemented`);
        planned.add(route);
      }
    }
  }

  return { implemented, planned, overlaps };
}

function collectTeamDocs() {
  if (!fs.existsSync(TEAM_DIR)) return [];

  return fs
    .readdirSync(TEAM_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .map((name) => path.join(TEAM_DIR, name));
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

  const apiDoc = parseRoutesFromFile(API_FILE);
  const peers = {};

  for (const name of PEER_DOCS) {
    peers[name] = parseRoutesFromFile(path.join(DOCS_DIR, name));
  }

  for (const teamPath of collectTeamDocs()) {
    const key = path.join("teams", path.basename(teamPath));
    peers[key] = parseRoutesFromFile(teamPath);
  }

  const actual = collectActualRoutes();
  const apiImplemented = apiDoc.implemented;
  const apiPlanned = apiDoc.planned;
  const documentedUnion = new Set([...apiImplemented, ...apiPlanned]);

  const failures = [];
  const warnings = [];

  for (const overlap of apiDoc.overlaps) {
    failures.push(`- [FAIL] API.md: ${overlap}`);
  }

  for (const [docName, parsed] of Object.entries(peers)) {
    for (const overlap of parsed.overlaps) {
      failures.push(`- [FAIL] ${docName}: ${overlap}`);
    }
  }

  for (const route of [...actual].sort()) {
    if (!documentedUnion.has(route)) {
      failures.push(`- [FAIL] UNTRACKED_ROUTE: actual route exists but missing in API.md -> ${route}`);
    }
  }

  for (const route of [...apiImplemented].sort()) {
    if (!actual.has(route)) {
      failures.push(`- [FAIL] STALE_IMPLEMENTED_ROUTE: API.md implemented route missing in app/api -> ${route}`);
    }
  }

  for (const route of [...apiPlanned].sort()) {
    if (actual.has(route) && !INTERNAL_EXEMPT_ROUTES.has(route)) {
      failures.push(`- [FAIL] PLANNED_ROUTE_HAS_CODE: API.md planned route already implemented -> ${route}`);
    }
  }

  const apiStatus = new Map();
  for (const route of apiImplemented) apiStatus.set(route, "implemented");
  for (const route of apiPlanned) apiStatus.set(route, "planned");

  for (const [docName, parsed] of Object.entries(peers)) {
    for (const route of parsed.implemented) {
      if (INTERNAL_EXEMPT_ROUTES.has(route)) continue;
      const status = apiStatus.get(route);
      if (!status) {
        failures.push(`- [FAIL] DOC_ONLY_IMPLEMENTED_ROUTE: ${route} in ${docName} missing in API.md`);
      } else if (status !== "implemented") {
        failures.push(`- [FAIL] STATUS_MISMATCH: ${route} is implemented in ${docName} but ${status} in API.md`);
      }
    }

    for (const route of parsed.planned) {
      if (INTERNAL_EXEMPT_ROUTES.has(route)) continue;
      const status = apiStatus.get(route);
      if (!status) {
        warnings.push(`- [WARN] DOC_ONLY_PLANNED_ROUTE: ${route} in ${docName} missing in API.md`);
      } else if (status !== "planned") {
        failures.push(`- [FAIL] STATUS_MISMATCH: ${route} is planned in ${docName} but ${status} in API.md`);
      }
    }
  }

  const report = [];
  report.push("# API Sync Audit Report");
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push(`- Actual routes: ${actual.size}`);
  report.push(`- API.md implemented routes: ${apiImplemented.size}`);
  report.push(`- API.md planned routes: ${apiPlanned.size}`);
  report.push(`- Result: ${failures.length === 0 ? "PASS" : "FAIL"}`);
  report.push("");

  report.push("## Scope");
  report.push("- apps/web/app/api");
  report.push("- apps/web/docs/API.md");
  report.push("- apps/web/docs/*.md");
  report.push("- apps/web/docs/teams/*.md");
  report.push("");

  if (failures.length > 0) {
    report.push("## Failures");
    report.push(...uniqSorted(failures));
    report.push("");
  }

  if (warnings.length > 0) {
    report.push("## Warnings");
    report.push(...uniqSorted(warnings));
    report.push("");
  }

  report.push("## API.md implemented");
  for (const route of [...apiImplemented].sort()) report.push(`- ${route}`);
  report.push("");

  report.push("## API.md planned");
  for (const route of [...apiPlanned].sort()) report.push(`- ${route}`);
  report.push("");

  report.push("## Actual routes in app/api");
  for (const route of [...actual].sort()) report.push(`- ${route}`);

  fs.writeFileSync(OUTPUT, `${report.join("\n")}\n`, "utf8");
  console.log(`API sync audit report -> ${OUTPUT}`);

  if (failures.length > 0) process.exit(1);
}

main();
