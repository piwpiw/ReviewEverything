import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

type FileEntry = {
  path: string;
  ext: string;
  size: number;
  mtime: string;
  hash: string;
  tags: string[];
  terms: string[];
};

type WorkspaceIndex = {
  version: number;
  mode: "lean" | "full";
  generatedAt: string;
  root: string;
  totalFiles: number;
  totalBytes: number;
  files: FileEntry[];
  termIndex: Record<string, string[]>;
};

const SKIP_DIRS = new Set([".git", ".next", ".vercel", "node_modules", "dist", "build", "coverage", ".turbo"]);

const LEAN_EXTS = new Set([".md", ".txt", ".tsx", ".ts", ".jsx", ".js"]);
const FULL_EXTS = new Set([".md", ".txt", ".tsx", ".ts", ".jsx", ".js", ".json", ".yml", ".yaml"]);
const TEXT_EXTS = new Set([".md", ".txt", ".tsx", ".ts", ".jsx", ".js", ".json", ".yml", ".yaml"]);

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "true",
  "false",
  "null",
  "undefined",
  "const",
  "let",
  "var",
  "return",
  "import",
  "export",
  "class",
  "function",
  "async",
  "await",
  "then",
  "else",
  "page",
  "layout",
  "script",
  "apps",
  "web",
]);

const LEAN_PARSE_BYTES = 64_000;
const FULL_PARSE_BYTES = 512_000;
const MAX_TERMS_PER_FILE = 20;
const MAX_GLOBAL_TERMS = 300;
const INDEX_BASENAME = {
  lean: "workspace-index-lean.json",
  full: "workspace-index-full.json",
} as const;
const INDEX_ALIAS = "workspace-index.json";

function getArg(name: string): string | undefined {
  const target = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(target));
  return match?.slice(target.length);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function tokenize(input: string): string[] {
  return input.toLowerCase().match(/[a-z][a-z0-9_-]{2,}|[가-힣]{2,}/g) ?? [];
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function chooseTerms(input: string, limit: number): string[] {
  const freq = new Map<string, number>();
  for (const token of tokenize(input)) {
    if (STOP_WORDS.has(token)) continue;
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

async function walk(dir: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) return;
        await walk(full, out);
        return;
      }
      if (!entry.isFile()) return;
      out.push(full);
    }),
  );
}

function classifyTags(rel: string, ext: string): string[] {
  const tags: string[] = [];
  if (rel.startsWith("app/")) tags.push("app");
  if (rel.startsWith("reports/")) tags.push("report");
  if (rel.startsWith("scripts/")) tags.push("script");
  if (ext === ".md" || ext === ".txt") tags.push("doc");
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) tags.push("code");
  if ([".json", ".yml", ".yaml"].includes(ext)) tags.push("config");
  return tags;
}

async function build(): Promise<void> {
  const scriptDir = __dirname;
  const webRoot = path.resolve(scriptDir, "..");
  const workspaceRoot = path.resolve(webRoot, "..");

  const mode: "lean" | "full" = hasFlag("full") || getArg("mode") === "full" ? "full" : "lean";
  const includeExt = mode === "full" ? FULL_EXTS : LEAN_EXTS;
  const root = path.resolve(getArg("root") ?? webRoot);
  const maxParseBytes = mode === "full" ? FULL_PARSE_BYTES : LEAN_PARSE_BYTES;

  const outDir = path.join(webRoot, "reports");
  const outMd = path.join(outDir, "workspace-index.md");
  const defaultIndexName = INDEX_BASENAME[mode];
  const outJson = path.resolve(outDir, getArg("out") ?? defaultIndexName);
  const aliasJson = path.resolve(outDir, INDEX_ALIAS);

  const candidates: string[] = [];
  await walk(root, candidates);

  const filteredFiles = candidates.filter((filePath) => includeExt.has(path.extname(filePath).toLowerCase()));
  const files: FileEntry[] = [];
  const termIndex = new Map<string, Set<string>>();
  let totalBytes = 0;

  await Promise.all(
    filteredFiles.map(async (filePath) => {
      const stat = await fs.stat(filePath);
      const rel = toPosix(path.relative(root, filePath));
      const ext = path.extname(filePath).toLowerCase();

      totalBytes += stat.size;
      const hash = createHash("sha1")
        .update(`${rel}:${stat.size}:${stat.mtimeMs}`)
        .digest("hex")
        .slice(0, 12);

      const pathTerms = chooseTerms(rel.replace(/[/.\\_-]/g, " "), 8);
      let contentTerms: string[] = [];

      if (TEXT_EXTS.has(ext) && stat.size <= maxParseBytes) {
        try {
          const content = await fs.readFile(filePath, "utf8");
          contentTerms = chooseTerms(content, mode === "full" ? 16 : 6);
        } catch {
          contentTerms = [];
        }
      }

      const terms = uniq([...pathTerms, ...contentTerms]).slice(0, MAX_TERMS_PER_FILE);
      const tags = classifyTags(rel, ext);

      for (const term of terms) {
        if (!termIndex.has(term)) termIndex.set(term, new Set());
        termIndex.get(term)!.add(rel);
      }

      files.push({
        path: rel,
        ext,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        hash,
        tags,
        terms,
      });
    }),
  );

  files.sort((a, b) => a.path.localeCompare(b.path));

  const sortedTerms = [...termIndex.entries()]
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, MAX_GLOBAL_TERMS);
  const compactIndex: Record<string, string[]> = {};
  for (const [term, paths] of sortedTerms) {
    compactIndex[term] = [...paths].sort();
  }

  const payload: WorkspaceIndex = {
    version: 3,
    mode,
    generatedAt: new Date().toISOString(),
    root: toPosix(root),
    totalFiles: files.length,
    totalBytes,
    files,
    termIndex: compactIndex,
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outJson, JSON.stringify(payload, null, 2), "utf8");
  if (path.resolve(outJson) !== path.resolve(aliasJson)) {
    await fs.copyFile(outJson, aliasJson);
  }

  const topTerms = Object.entries(compactIndex)
    .slice(0, 20)
    .map(([term, list]) => `- \`${term}\` (${list.length})`)
    .join("\n");

  const topFiles = files
    .slice(0, 20)
    .map((entry) => `- \`${entry.path}\` | ${entry.ext || "(no-ext)"} | ${entry.size} bytes | ${entry.tags.join(",")}`)
    .join("\n");

  const summary = [
    "# Workspace Index",
    `- Version: ${payload.version}`,
    `- Mode: ${payload.mode}`,
    `- Generated At: ${payload.generatedAt}`,
    `- Root: \`${payload.root}\``,
    `- Total Files: ${payload.totalFiles}`,
    `- Total Bytes: ${payload.totalBytes}`,
    "",
    "## Top Terms",
    topTerms || "- (none)",
    "",
    "## File Samples",
    topFiles || "- (none)",
    "",
    "## Commands",
    "- Lean index: `npm run index:workspace`",
    "- Full index: `npm run index:workspace:full`",
    "- Search (auto): `npm run search:workspace -- --q=keyword`",
    "- Search lean/full override: `npm run search:workspace -- --q=keyword --mode=lean|full|auto`",
    "- Direct files: `npm run search:workspace -- --q=keyword --index=reports/workspace-index-lean.json|workspace-index-full.json`",
  ].join("\n");

  await fs.writeFile(outMd, summary, "utf8");
  console.log(`Indexed ${payload.totalFiles} files (${mode}) -> ${toPosix(path.relative(webRoot, outJson))}`);
}

void build().catch((error) => {
  console.error("Failed to build workspace index:", error);
  process.exit(1);
});
