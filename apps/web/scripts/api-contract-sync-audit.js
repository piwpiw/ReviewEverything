#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const TEAM_DIR = path.join(DOCS_DIR, "teams");
const APP_API_DIR = path.join(ROOT, "app", "api");
const REPORT_DIR = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORT_DIR, "api-contract-sync-audit.md");

const CORE_DOCS = [
  "API.md",
  "ARCHITECTURE.md",
  "TEAM_CONTEXT.md",
  "AGENT_WORKFLOW.md",
  "PROJECT_STATUS.md",
  "PROJECT_STATUS_NEXT_ACTIONS.md",
  "SCRAPERS.md",
];

const INTERNAL_EXEMPT_ROUTES = new Set(["/api/jobs"]);

const ROUTE_RX = /\b(?:GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)?\s*(\/api\/[A-Za-z0-9._\-\/\[\]:*]+)(?=(\s|$|[`),.;:!])/gi;

function normalizeRoute(rawRoute) {
  if (!rawRoute) return null;

  let route = rawRoute.trim();
  route = route.replace(/^[`'"]+/g, "").replace(/[`'"]+$/g, "");
  route = route.replace(/^(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\s+/i, "");
  route = route.split("?")[0];
  route = route.replace(/\[([^\]]+)\]/g, ":$1");
  route = route.replace(/\/{2,}/g, "/");

  if (!route.startsWith("/api/")) return null;
  return route;
}

function extractRoutes(line) {
  const matches = new Set();
  let match = ROUTE_RX.exec(line);

  while (match !== null) {
    const route = normalizeRoute(match[1]);
    if (route) {
      matches.add(route);
    }
    match = ROUTE_RX.exec(line);
  }

  ROUTE_RX.lastIndex = 0;
  return matches;
}

function inferStatus(line) {
  const text = line.toLowerCase();
  const hasImplemented = /(implemented|implemented api|implemented route|implementation|\uAD6C\uD604)/i.test(text);
  const hasPlanned = /(planned|to be implemented|not implemented|deferred|\uBBF8\uAD6C\uD604|\uACC4\uD68D)/i.test(text);
  if (hasImplemented) return "implemented";
  if (hasPlanned) return "planned";
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
    const statusHint = inferStatus(line);
    if (statusHint) {
      context = statusHint;
    }

    const routes = extractRoutes(line);
    if (routes.size === 0) continue;

    const status = statusHint || context;
    if (!status) continue;

    for (const route of routes) {
      if (status === "implemented") {
        if (planned.has(route)) overlaps.push(`${path.basename(filePath)}: ${route} implemented + planned`);
        implemented.add(route);
      } else {
        if (implemented.has(route)) overlaps.push(`${path.basename(filePath)}: ${route} planned + implemented`);
        planned.add(route);
      }
    }
  }

  return { implemented, planned, overlaps };
}

function collectActualRoutes() {
  const routes = new Set();

  function walk(dir, segments) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith(".")) continue;
      const fullPath = path.join(dir, item.name);
      const nextSegments = [...segments, item.name];

      if (item.isDirectory()) {
        walk(fullPath, nextSegments);
        continue;
      }

      if (item.isFile() && item.name === "route.ts") {
        const routeParts = nextSegments.slice(2).map((seg) => seg.replace(/^\[(.+)\]$/, ":$1"));
        if (routeParts.length > 0) {
          routes.add(`/api/${routeParts.join("/")}`);
        }
      }
    }
  }

  walk(APP_API_DIR, ["app", "api"]);
  routes.delete("/api");
  return routes;
}

function collectTeamDocs() {
  if (!fs.existsSync(TEAM_DIR)) return [];
  return fs
    .readdirSync(TEAM_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .map((name) => path.join(TEAM_DIR, name));
}

function uniqSorted(arr) {
  return [...new Set(arr)].sort();
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const apiFilePath = path.join(DOCS_DIR, "API.md");
  const apiDoc = parseRoutesFromFile(apiFilePath);

  const docsToCheck = {
    ...Object.fromEntries(
      CORE_DOCS.map((name) => {
        const parsed = parseRoutesFromFile(path.join(DOCS_DIR, name));
        return [name.replace(".md", ""), parsed];
      })
    ),
  };
  for (const teamDoc of collectTeamDocs()) {
    const key = path.join("teams", path.basename(teamDoc));
    docsToCheck[key] = parseRoutesFromFile(teamDoc);
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

  for (const [source, parsed] of Object.entries(docsToCheck)) {
    for (const overlap of parsed.overlaps) {
      failures.push(`- [FAIL] ${source}: ${overlap}`);
    }
  }

  for (const route of actual) {
    if (!documentedUnion.has(route)) {
      failures.push(`- [FAIL] UNTRACKED_ROUTE: actual route exists but missing in API.md -> ${route}`);
    }
  }

  for (const route of apiImplemented) {
    if (!actual.has(route)) {
      failures.push(`- [FAIL] STALE_IMPLEMENTED_ROUTE: API.md implemented route missing in app/api -> ${route}`);
    }
  }

  for (const route of apiPlanned) {
    if (actual.has(route) && !INTERNAL_EXEMPT_ROUTES.has(route)) {
      failures.push(`- [FAIL] PLANNED_ROUTE_HAS_CODE: API.md planned route is implemented in code -> ${route}`);
    }
  }

  const apiRouteStatus = new Map();
  for (const route of apiImplemented) apiRouteStatus.set(route, "implemented");
  for (const route of apiPlanned) apiRouteStatus.set(route, "planned");

  for (const route of apiPlanned) {
    let hasStatusInPeerDoc = false;

    for (const [source, parsed] of Object.entries(docsToCheck)) {
      if (source === "API") continue;
      if (parsed.implemented.has(route) || parsed.planned.has(route)) {
        hasStatusInPeerDoc = true;
      }
    }

    if (!hasStatusInPeerDoc) {
      warnings.push(`- [WARN] planned route no peer-doc status yet: ${route}`);
    }
  }

  for (const [source, parsed] of Object.entries(docsToCheck)) {
    if (source === "API") continue;

    for (const route of parsed.implemented) {
      if (INTERNAL_EXEMPT_ROUTES.has(route)) continue;
      const apiStatus = apiRouteStatus.get(route);
      if (!apiStatus) {
        failures.push(`- [FAIL] DOC_ONLY_IMPLEMENTED_ROUTE: ${route} in ${source} is not in API.md`);
      } else if (apiStatus === "planned") {
        failures.push(`- [FAIL] STATUS_MISMATCH: ${route} is implemented in ${source} but planned in API.md`);
      }
    }

    for (const route of parsed.planned) {
      if (INTERNAL_EXEMPT_ROUTES.has(route)) continue;
      const apiStatus = apiRouteStatus.get(route);
      if (!apiStatus) {
        failures.push(`- [FAIL] DOC_ONLY_PLANNED_ROUTE: ${route} in ${source} is not in API.md`);
      } else if (apiStatus === "implemented") {
        failures.push(`- [FAIL] STATUS_MISMATCH: ${route} is planned in ${source} but implemented in API.md`);
      }
    }
  }

  if (actual.has("/api/health") && !apiImplemented.has("/api/health")) {
    failures.push("- [FAIL] health visibility mismatch: /api/health is actual but not implemented in API.md");
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
  report.push("- apps/web/docs/ARCHITECTURE.md");
  report.push("- apps/web/docs/TEAM_CONTEXT.md");
  report.push("- apps/web/docs/AGENT_WORKFLOW.md");
  report.push("- apps/web/docs/PROJECT_STATUS.md");
  report.push("- apps/web/docs/PROJECT_STATUS_NEXT_ACTIONS.md");
  report.push("- apps/web/docs/SCRAPERS.md");
  report.push("- apps/web/docs/teams/*.md");
  report.push("");

  if (failures.length > 0) {
    report.push("## Failures");
    for (const line of uniqSorted(failures)) {
      report.push(line);
    }
    report.push("");
  }

  if (warnings.length > 0) {
    report.push("## Warnings");
    for (const line of uniqSorted(warnings)) {
      report.push(line);
    }
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

  fs.writeFileSync(OUTPUT, `${report.join("\n")}\n`);
  console.log(`API sync audit report -> ${OUTPUT}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();

