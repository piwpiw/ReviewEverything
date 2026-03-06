import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

type SearchMode = "lean" | "full" | "auto";
type IndexMode = "lean" | "full";

type SearchOutput = {
  query: string;
  requestedMode: SearchMode;
  selectedMode: IndexMode;
  executedMode: IndexMode;
  usedFallback: boolean;
  fallbackReason?: string;
  candidates: string[];
  matches: string[];
  elapsedMs: number;
  totalCandidates: number;
  usedIndex: string;
  usedIndexMode: IndexMode;
};

type BenchCase = {
  mode: SearchMode;
  query: string;
  selectedMode: IndexMode;
  executedMode: IndexMode;
  usedFallback: boolean;
  fallbackReason?: string;
  candidates: number;
  matches: number;
  elapsedMs: number;
  usedIndex: string;
  usedIndexMode: IndexMode;
};

type BenchSummaryRow = {
  mode: SearchMode;
  queryCount: number;
  fallbackCount: number;
  totalCandidates: number;
  totalMatches: number;
  totalMs: number;
  minElapsedMs: number;
  maxElapsedMs: number;
  executedModes: Record<IndexMode, number>;
};

type GuardConfig = {
  enabled: boolean;
  maxElapsedMs?: number;
  minCandidates?: number;
  minMatches?: number;
  maxFallbackRate?: number;
};

type BenchReport = {
  generatedAt: string;
  queries: string[];
  results: BenchCase[];
  summary: BenchSummaryRow[];
  guard: {
    enabled: boolean;
    thresholds: GuardConfig;
    failures: string[];
    passed: boolean;
  };
};

const DEFAULT_QUERY_SET = ["metadata", "layout", "page", "report", "admin", "me", "캠페인", "campaign"];
const INDEX_ARGS_BY_MODE: Record<SearchMode, string[]> = {
  lean: ["--index=reports/workspace-index-lean.json"],
  full: ["--index=reports/workspace-index-full.json"],
  auto: ["--index-lean=reports/workspace-index-lean.json", "--index-full=reports/workspace-index-full.json"],
};

function getArg(name: string, fallback: string): string {
  const key = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(key));
  return found ? found.slice(key.length) : fallback;
}

function hasArg(name: string): boolean {
  const key = `--${name}=`;
  return process.argv.some((arg) => arg.startsWith(key));
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parseIntArg(name: string, fallback: number): number {
  const raw = getArg(name, String(fallback));
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseFloatArg(name: string, fallback: number): number {
  const raw = getArg(name, String(fallback));
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function parseList(raw: string, fallback: string[]): string[] {
  if (raw.length > 0) {
    const parsed = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  return fallback;
}

function normalizeMode(value: string): SearchMode | undefined {
  if (value === "lean" || value === "full" || value === "auto") {
    return value;
  }
  return undefined;
}

function parseModes(raw: string): SearchMode[] {
  const values = parseList(raw, ["lean", "full", "auto"])
    .map(normalizeMode)
    .filter((value): value is SearchMode => value !== undefined);

  const normalized = [...new Set(values)];
  return normalized.length > 0 ? normalized : ["lean", "full", "auto"];
}

function runCommand(cmd: string, args: string[]): string {
  const escaped = args
    .map((value) => `"${value.replace(/"/g, "\\\"")}"`)
    .join(" ");
  const command = `${cmd} ${escaped}`;
  return execSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 12 * 1024 * 1024,
  }).toString();
}

function runBenchmarkSearch(query: string, limit: number, mode: SearchMode): SearchOutput {
  const out = runCommand("npx", [
    "tsx",
    "scripts/search-workspace.ts",
    `--q=${query}`,
    `--limit=${limit}`,
    `--mode=${mode}`,
    "--json",
    ...INDEX_ARGS_BY_MODE[mode],
  ]);

  return JSON.parse(out) as SearchOutput;
}

function summarize(results: BenchCase[]): BenchSummaryRow[] {
  const buckets = new Map<SearchMode, BenchSummaryRow>();

  for (const result of results) {
    const bucket = buckets.get(result.mode) ?? {
      mode: result.mode,
      queryCount: 0,
      fallbackCount: 0,
      totalCandidates: 0,
      totalMatches: 0,
      totalMs: 0,
      minElapsedMs: Number.POSITIVE_INFINITY,
      maxElapsedMs: 0,
      executedModes: { lean: 0, full: 0 },
    };

    bucket.queryCount += 1;
    bucket.totalCandidates += result.candidates;
    bucket.totalMatches += result.matches;
    bucket.totalMs += result.elapsedMs;
    bucket.minElapsedMs = Math.min(bucket.minElapsedMs, result.elapsedMs);
    bucket.maxElapsedMs = Math.max(bucket.maxElapsedMs, result.elapsedMs);
    bucket.executedModes[result.executedMode] += 1;
    if (result.usedFallback) bucket.fallbackCount += 1;

    buckets.set(result.mode, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.mode.localeCompare(b.mode));
}

function resolveGuardConfig(): GuardConfig {
  return {
    enabled: hasFlag("guard"),
    maxElapsedMs: hasArg("guard-max-elapsed-ms") ? parseIntArg("guard-max-elapsed-ms", Number.NaN) : undefined,
    minCandidates: hasArg("guard-min-candidates") ? parseIntArg("guard-min-candidates", Number.NaN) : undefined,
    minMatches: hasArg("guard-min-matches") ? parseIntArg("guard-min-matches", Number.NaN) : undefined,
    maxFallbackRate: hasArg("guard-max-fallback-rate")
      ? parseFloatArg("guard-max-fallback-rate", Number.NaN)
      : undefined,
  };
}

function normalizeGuardValue(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function assertGuardConfig(config: GuardConfig): GuardConfig {
  return {
    enabled: config.enabled,
    maxElapsedMs: normalizeGuardValue(config.maxElapsedMs),
    minCandidates: normalizeGuardValue(config.minCandidates),
    minMatches: normalizeGuardValue(config.minMatches),
    maxFallbackRate: normalizeGuardValue(config.maxFallbackRate),
  };
}

function checkGuard(summary: BenchSummaryRow[]): { passed: boolean; failures: string[] } {
  const config = assertGuardConfig(resolveGuardConfig());
  if (!config.enabled) {
    return { passed: true, failures: [] };
  }

  const failures: string[] = [];

  for (const row of summary) {
    const avgElapsed = row.totalMs / row.queryCount;
    const avgCandidates = row.totalCandidates / row.queryCount;
    const avgMatches = row.totalMatches / row.queryCount;
    const fallbackRate = row.fallbackCount / row.queryCount;

    if (config.maxElapsedMs !== undefined && avgElapsed > config.maxElapsedMs) {
      failures.push(`mode=${row.mode} avgElapsed=${avgElapsed.toFixed(2)}ms exceeds max=${config.maxElapsedMs}ms`);
    }

    if (config.minCandidates !== undefined && avgCandidates < config.minCandidates) {
      failures.push(`mode=${row.mode} avgCandidates=${avgCandidates.toFixed(2)} below min=${config.minCandidates}`);
    }

    if (config.minMatches !== undefined && avgMatches < config.minMatches) {
      failures.push(`mode=${row.mode} avgMatches=${avgMatches.toFixed(2)} below min=${config.minMatches}`);
    }

    if (config.maxFallbackRate !== undefined && fallbackRate > config.maxFallbackRate) {
      failures.push(`mode=${row.mode} fallbackRate=${fallbackRate.toFixed(2)} exceeds max=${config.maxFallbackRate}`);
    }
  }

  return { passed: failures.length === 0, failures };
}

function guardSummaryRow(row: BenchSummaryRow): string[] {
  const avgElapsed = (row.totalMs / row.queryCount).toFixed(2);
  const avgCandidates = (row.totalCandidates / row.queryCount).toFixed(2);
  const avgMatches = (row.totalMatches / row.queryCount).toFixed(2);

  return [
    `### ${row.mode}`,
    `- Query count: ${row.queryCount}`,
    `- Fallback count: ${row.fallbackCount}`,
    `- Avg candidates: ${avgCandidates}`,
    `- Avg matches: ${avgMatches}`,
    `- Avg elapsed: ${avgElapsed}ms`,
    `- Min elapsed: ${row.minElapsedMs}ms`,
    `- Max elapsed: ${row.maxElapsedMs}ms`,
    `- Executed modes: ${Object.entries(row.executedModes)
      .filter(([, count]) => count > 0)
      .map(([mode, count]) => `${mode}: ${count}`)
      .join(", ")}`,
    "",
  ];
}

async function writeReport(report: BenchReport, outBase: string): Promise<void> {
  const outDir = path.join(process.cwd(), "reports");
  await fs.mkdir(outDir, { recursive: true });

  const outJson = path.join(outDir, `${outBase}.json`);
  const outMd = path.join(outDir, `${outBase}.md`);
  await fs.writeFile(outJson, JSON.stringify(report, null, 2), "utf8");

  const modesInResult = [...new Set(report.results.map((item) => item.mode))].join(", ");
  const lines = [
    "# Workspace Search Benchmark",
    `- Generated At: ${report.generatedAt}`,
    `- Queries: ${report.queries.length}`,
    `- Modes: ${modesInResult}`,
    "",
    "## Summary by requested mode",
    ...report.summary.flatMap((row) => guardSummaryRow(row)),
    "## Guard",
    `- Enabled: ${report.guard?.enabled ? "yes" : "no"}`,
    `- Passed: ${report.guard?.passed ? "yes" : "no"}`,
    ...(report.guard?.enabled && !report.guard.passed
      ? ["- Failures:", ...report.guard.failures.map((item) => `  - ${item}`)]
      : ["- Failures: none"]),
    "",
    "## Details",
    ...report.results.map(
      (item) =>
        `- ${item.mode} ${item.query} | selected=${item.selectedMode} executed=${item.executedMode} | fallback=${item.usedFallback} | candidates=${item.candidates} matches=${item.matches} elapsed=${item.elapsedMs}ms | index=${item.usedIndex}`,
    ),
    "",
  ];

  await fs.writeFile(outMd, lines.join("\n"), "utf8");
}

async function main(): Promise<void> {
  const limit = parseIntArg("limit", 80);
  const queryArg = getArg("queries", DEFAULT_QUERY_SET.join(","));
  const modes = parseModes(getArg("modes", "lean,full,auto"));
  const skipBuild = process.argv.includes("--skip-build");

  const queries = queryArg
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const indexToBuild = new Set<IndexMode>();
  if (modes.includes("lean") || modes.includes("auto")) indexToBuild.add("lean");
  if (modes.includes("full") || modes.includes("auto")) indexToBuild.add("full");

  if (!skipBuild) {
    if (indexToBuild.has("lean")) runCommand("npm", ["run", "index:workspace"]);
    if (indexToBuild.has("full")) runCommand("npm", ["run", "index:workspace:full"]);
  }

  const results: BenchCase[] = [];

  for (const mode of modes) {
    for (const query of queries) {
      const searchResult = runBenchmarkSearch(query, limit, mode);
      results.push({
        mode,
        query,
        selectedMode: searchResult.selectedMode,
        executedMode: searchResult.executedMode,
        usedFallback: searchResult.usedFallback,
        fallbackReason: searchResult.fallbackReason,
        candidates: searchResult.totalCandidates,
        matches: searchResult.matches.length,
        elapsedMs: searchResult.elapsedMs,
        usedIndex: searchResult.usedIndex,
        usedIndexMode: searchResult.usedIndexMode,
      });
    }
  }

  const summary = summarize(results);
  const guard = checkGuard(summary);

  const report: BenchReport = {
    generatedAt: new Date().toISOString(),
    queries,
    results,
    summary,
    guard: {
      enabled: resolveGuardConfig().enabled,
      thresholds: assertGuardConfig(resolveGuardConfig()),
      failures: guard.failures,
      passed: guard.passed,
    },
  };

  await writeReport(report, "workspace-search-bench");

  console.log("[workspace-search-bench] done");
  for (const row of report.summary) {
    const avgElapsed = (row.totalMs / row.queryCount).toFixed(2);
    const avgCandidates = (row.totalCandidates / row.queryCount).toFixed(2);
    const avgMatches = (row.totalMatches / row.queryCount).toFixed(2);
    console.log(`${row.mode}: elapsed(avg/max)=${avgElapsed}/${row.maxElapsedMs}ms, candidates=${avgCandidates}, matches=${avgMatches}, fallback=${row.fallbackCount}/${row.queryCount}`);
  }

  if (report.guard.enabled) {
    console.log(`[workspace-search-bench] guard=${report.guard.enabled ? "enabled" : "disabled"}`);
    if (!report.guard.passed) {
      for (const failure of report.guard.failures) {
        console.error(`[workspace-search-bench][guard] ${failure}`);
      }
      process.exit(1);
    }
    console.log("[workspace-search-bench] guard passed");
  }
}

void main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
