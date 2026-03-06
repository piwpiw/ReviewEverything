import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_SEARCH_LIMIT = 80;
const AUTO_FULL_TRIGGER_LEN = 4;
const AUTO_FALLBACK_MAX_TOKENS = 1;
const AUTO_FALLBACK_MIN_MATCHES = 5;
const AUTO_FALLBACK_MIN_CANDIDATES = 4;
const CANDIDATE_PREVIEW_LIMIT = 10;
const CLI_MATCH_PREVIEW_LIMIT = 200;

type SearchMode = "lean" | "full" | "auto";
type IndexMode = "lean" | "full";

type WorkspaceIndex = {
  version?: number;
  mode?: IndexMode;
  root: string;
  files: Array<{ path: string; terms: string[]; tags: string[] }>;
  termIndex: Record<string, string[]>;
};

type IndexSelection = {
  path: string;
  mode: IndexMode;
  source: "requested" | "alias" | "fallback";
};

type CandidateScore = {
  path: string;
  score: number;
  why: string[];
};

type FallbackReason = "query-too-short" | "no-candidates" | "low-match-rate" | "few-candidates";

type SearchResult = {
  query: string;
  mode: "exact" | "candidate-fallback";
  requestedMode: SearchMode;
  selectedMode: IndexMode;
  executedMode: IndexMode;
  usedFallback: boolean;
  fallbackReason?: FallbackReason;
  candidates: string[];
  matches: string[];
  elapsedMs: number;
  totalCandidates: number;
  usedIndex: string;
  usedIndexMode: IndexMode;
};

function getArg(name: string): string | undefined {
  const target = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(target));
  return match?.slice(target.length);
}

function getIntArg(name: string, fallback: number): number {
  const raw = getArg(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
}

function normalizeMode(value: string | undefined): SearchMode {
  if (value === "lean" || value === "full" || value === "auto") {
    return value;
  }
  return "auto";
}

function inferIndexPath(webRoot: string, argValue: string | undefined, defaultPath: string): string {
  const resolved = argValue ?? defaultPath;
  return path.isAbsolute(resolved) ? resolved : path.resolve(webRoot, resolved);
}

function tokenize(input: string): string[] {
  return input.toLowerCase().match(/[a-z][a-z0-9_-]{1,}|[가-힣]{2,}/g) ?? [];
}

async function loadIndex(indexPath: string): Promise<WorkspaceIndex> {
  const raw = await fs.readFile(indexPath, "utf8");
  return JSON.parse(raw) as WorkspaceIndex;
}

async function hasIndex(indexPath: string): Promise<boolean> {
  try {
    await fs.access(indexPath);
    return true;
  } catch {
    return false;
  }
}

function resolveIndexSelection(
  requested: IndexMode,
  availability: { lean: boolean; full: boolean; alias: boolean },
  paths: { lean: string; full: string; alias: string },
): IndexSelection {
  if (requested === "lean") {
    if (availability.lean) {
      return { path: paths.lean, mode: "lean", source: "requested" };
    }
    if (availability.alias) {
      return { path: paths.alias, mode: "lean", source: "alias" };
    }
    return { path: paths.full, mode: "full", source: "fallback" };
  }

  if (availability.full) {
    return { path: paths.full, mode: "full", source: "requested" };
  }
  if (availability.alias) {
    return { path: paths.alias, mode: "full", source: "alias" };
  }
  return { path: paths.lean, mode: "lean", source: "fallback" };
}

function addCandidate(map: Map<string, CandidateScore>, relPath: string, score: number, reason: string): void {
  const key = relPath.toLowerCase();
  const current = map.get(key);
  if (!current) {
    map.set(key, { path: relPath, score, why: [reason] });
    return;
  }
  current.score += score;
  current.why.push(reason);
}

function pickCandidates(index: WorkspaceIndex, query: string, limit: number): CandidateScore[] {
  const tokens = tokenize(query);
  const lowerQuery = query.toLowerCase();
  const byScore = new Map<string, CandidateScore>();

  for (const token of tokens) {
    const exactMatches = index.termIndex[token] ?? [];
    for (const relPath of exactMatches) {
      addCandidate(byScore, relPath, 12, `term:${token}`);
    }

    if (token.length >= 3) {
      for (const [term, paths] of Object.entries(index.termIndex)) {
        if (term.includes(token) && term !== token) {
          for (const relPath of paths) {
            addCandidate(byScore, relPath, 5, `term-like:${token}->${term}`);
          }
        }
      }
    }
  }

  if (tokens.length === 0) {
    return [];
  }

  for (const file of index.files) {
    const relPath = file.path.toLowerCase();
    if (relPath.includes(lowerQuery)) {
      addCandidate(byScore, file.path, 2, `path-contains:${lowerQuery}`);
    }

    for (const tag of file.tags) {
      if (lowerQuery.includes(tag.toLowerCase())) {
        addCandidate(byScore, file.path, 1, `tag:${tag}`);
      }
    }

    for (const term of file.terms) {
      if (lowerQuery.includes(term.toLowerCase())) {
        addCandidate(byScore, file.path, 1, `term-in-file:${term}`);
      }
    }
  }

  if (byScore.size > 0) {
    return [...byScore.values()]
      .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
      .slice(0, limit);
  }

  return [];
}

function formatCandidateLines(candidates: CandidateScore[]): string {
  return candidates
    .slice(0, CANDIDATE_PREVIEW_LIMIT)
    .map((item) => `${item.path} (score:${item.score})`)
    .join("; ");
}

async function runRg(
  root: string,
  query: string,
  relCandidates: CandidateScore[],
  useRegex: boolean,
): Promise<string[]> {
  const hasCandidates = relCandidates.length > 0;
  const searchTargets = hasCandidates
    ? relCandidates.map((item) => path.resolve(root, item.path))
    : [root];

  const args = [
    "-n",
    "--no-heading",
    "--color",
    "never",
    "--ignore-case",
    useRegex ? "-S" : "--fixed-strings",
    query,
    ...searchTargets,
  ];

  try {
    const { stdout } = await execFileAsync("rg", args, {
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout.split(/\r?\n/).filter(Boolean);
  } catch (error: any) {
    const out = error?.stdout;
    if (typeof out === "string" && out.trim().length > 0) {
      return out.split(/\r?\n/).filter(Boolean);
    }
    return [];
  }
}

function dedupeLines(lines: string[]): string[] {
  return [...new Set(lines)];
}

function decideAutoFallback(query: string, candidates: CandidateScore[], matches: string[]): FallbackReason | undefined {
  const tokens = tokenize(query);
  if (tokens.length <= AUTO_FALLBACK_MAX_TOKENS) return "query-too-short";
  if (candidates.length === 0) return "no-candidates";
  if (matches.length < AUTO_FALLBACK_MIN_MATCHES) return "low-match-rate";
  if (candidates.length < AUTO_FALLBACK_MIN_CANDIDATES) return "few-candidates";
  return undefined;
}

function primaryModeForAuto(query: string, hasFullIndex: boolean): IndexMode {
  if (!hasFullIndex) return "lean";
  const tokens = tokenize(query);
  if (query.length <= AUTO_FULL_TRIGGER_LEN || tokens.length <= AUTO_FALLBACK_MAX_TOKENS) return "full";
  return "lean";
}

async function runSearch(
  index: WorkspaceIndex,
  query: string,
  limit: number,
  useRegex: boolean,
): Promise<{ candidates: CandidateScore[]; matches: string[] }> {
  const candidates = pickCandidates(index, query, limit);
  const matches = await runRg(index.root, query, candidates, useRegex);
  return { candidates, matches };
}

function describeIndexSource(source: IndexSelection["source"]): string {
  if (source === "alias") return "workspace-index.json alias";
  if (source === "fallback") return "automatic fallback";
  return "requested mode";
}

async function main(): Promise<void> {
  const scriptDir = __dirname;
  const webRoot = path.resolve(scriptDir, "..");
  const indexAlias = inferIndexPath(webRoot, getArg("index"), path.join("reports", "workspace-index.json"));
  const leanIndexPath = inferIndexPath(webRoot, getArg("index-lean"), path.join("reports", "workspace-index-lean.json"));
  const fullIndexPath = inferIndexPath(webRoot, getArg("index-full"), path.join("reports", "workspace-index-full.json"));

  const requestedMode = normalizeMode(getArg("mode"));
  const query = getArg("q");
  const limit = getIntArg("limit", DEFAULT_SEARCH_LIMIT);
  const useRegex = process.argv.includes("--regex");
  const outputJson = process.argv.includes("--json");

  if (!query) {
    console.error("Missing query. Use: npm run search:workspace -- --q=keyword");
    process.exit(1);
  }

  const hasLean = await hasIndex(leanIndexPath);
  const hasFull = await hasIndex(fullIndexPath);
  const hasAlias = await hasIndex(indexAlias);

  const autoPrimary = requestedMode === "auto" ? primaryModeForAuto(query, hasFull) : undefined;
  const selectedMode: IndexMode = requestedMode === "auto" ? autoPrimary ?? "lean" : requestedMode;
  const selectedIndex = resolveIndexSelection(
    selectedMode,
    { lean: hasLean, full: hasFull, alias: hasAlias },
    { lean: leanIndexPath, full: fullIndexPath, alias: indexAlias },
  );

  if (!(await hasIndex(selectedIndex.path))) {
    console.error(
      "No usable index found. Run npm run index:workspace or npm run index:workspace:full first.",
    );
    process.exit(1);
  }

  const primaryIndex = await loadIndex(selectedIndex.path);
  const indexMode = primaryIndex.mode ?? selectedIndex.mode;
  const start = Date.now();
  let searchResult = await runSearch(primaryIndex, query, limit, useRegex);
  let executedMode: IndexMode = indexMode;
  let usedFallback = false;
  let fallbackReason: FallbackReason | undefined;

  if (
    requestedMode === "auto" &&
    selectedMode === "lean" &&
    hasFull &&
    (fallbackReason = decideAutoFallback(query, searchResult.candidates, searchResult.matches))
  ) {
    const fullIndex = hasFull ? await loadIndex(fullIndexPath) : primaryIndex;
    const fullSearch = await runSearch(fullIndex, query, limit, useRegex);
    if (fullSearch.matches.length > searchResult.matches.length) {
      searchResult = fullSearch;
      executedMode = fullIndex.mode ?? "full";
      usedFallback = true;
    } else {
      fallbackReason = undefined;
    }
  }

  const elapsedMs = Date.now() - start;
  const result: SearchResult = {
    query,
    mode: searchResult.candidates.length > 0 ? "exact" : "candidate-fallback",
    requestedMode,
    selectedMode,
    executedMode,
    usedFallback,
    fallbackReason: usedFallback ? fallbackReason : undefined,
    candidates: searchResult.candidates.map((item) => item.path),
    matches: dedupeLines(searchResult.matches),
    elapsedMs,
    totalCandidates: searchResult.candidates.length,
    usedIndex: path.basename(selectedIndex.path),
    usedIndexMode: executedMode,
  };

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (searchResult.matches.length === 0) {
    console.log(`No exact matches found for "${query}" in ${searchResult.candidates.length} indexed candidates.`);
    if (searchResult.candidates.length > 0) {
      console.log(`Top candidates: ${formatCandidateLines(searchResult.candidates)}`);
    }
    return;
  }

  console.log(`# Hybrid Search Result`);
  console.log(`- Query: ${query}`);
  console.log(`- Requested mode: ${requestedMode}`);
  if (requestedMode === "auto" && autoPrimary) {
    console.log(`- Auto primary mode: ${autoPrimary}`);
  }
  console.log(`- Selected index mode: ${selectedMode}`);
  console.log(`- Executed mode: ${executedMode}`);
  console.log(`- Index source: ${describeIndexSource(selectedIndex.source)} (${path.basename(selectedIndex.path)})`);
  console.log(`- Fallback used: ${usedFallback ? `yes (${fallbackReason ?? "candidate fallback"})` : "no"}`);
  console.log(`- Candidates: ${searchResult.candidates.length}`);
  console.log(`- Matches: ${searchResult.matches.length}`);
  console.log(`- Elapsed: ${elapsedMs}ms`);
  if (searchResult.candidates.length > 0) {
    console.log(`- Top candidates: ${formatCandidateLines(searchResult.candidates)}`);
  }
  console.log("");

  for (const line of searchResult.matches.slice(0, CLI_MATCH_PREVIEW_LIMIT)) {
    const normalized = line.replace(/\\/g, "/");
    console.log(`- ${normalized}`);
  }
}

void main().catch((error) => {
  console.error("Search failed:", error);
  process.exit(1);
});
