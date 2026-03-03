import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs/promises";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

type ArgMap = Record<string, string | undefined>;

type LoopSummary = {
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  cycleMinutes: number;
  completedCycles: number;
  stopReason: "duration" | "signal";
  tasks: Array<{
    cycle: number;
    startedAt: string;
    endedAt: string;
    command: string;
    exitCode: number;
    durationMs: number;
    output: string;
  }>;
  healthChecks: Array<{ timestamp: string; status: number; ok: boolean; url: string; bodyPreview: string }>;
};

const DEFAULT_DURATION_MINUTES = 300;
const DEFAULT_CYCLE_MINUTES = 20;
const DEFAULT_HEALTH_URL = "https://revieweverything-web-piwpiw99.vercel.app/api/health";
const DEFAULT_INGEST_PHASES = "A,B,C";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv: string[]): ArgMap {
  const out: ArgMap = {};
  for (const token of argv) {
    if (!token.startsWith("--")) continue;
    const [rawKey, rawVal] = token.substring(2).split("=", 2);
    out[rawKey.trim()] = rawVal?.trim();
  }
  return out;
}

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number.parseInt(raw ?? String(fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function boolValue(raw: string | undefined, fallback: boolean) {
  if (raw === undefined) return fallback;
  return String(raw).toLowerCase() === "true";
}

async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; logFile: string; label: string },
): Promise<{ exitCode: number; output: string }> {
  const runner = process.platform === "win32" ? (command.endsWith(".cmd") ? command : `${command}.cmd`) : command;
  const child = spawn(runner, args, {
    cwd: options.cwd,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  }) as ChildProcessWithoutNullStreams;

  const chunks: string[] = [];
  if (!existsSync(path.dirname(options.logFile))) {
    mkdirSync(path.dirname(options.logFile), { recursive: true });
  }
  const stream = createWriteStream(options.logFile, { flags: "a" });
  const prefix = `[${new Date().toISOString()}][${options.label}] `;

  const onData = (chunk: Buffer, streamType: "stdout" | "stderr") => {
    const text = chunk.toString();
    chunks.push(`${streamType}: ${text}`);
    stream.write(prefix + text);
    process.stdout.write(prefix + text);
  };

  child.stdout?.on("data", (c) => onData(c as Buffer, "stdout"));
  child.stderr?.on("data", (c) => onData(c as Buffer, "stderr"));

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });

  stream.end();
  return { exitCode, output: chunks.join("") };
}

async function runGitStatus(cwd: string) {
  const result = await runCommand("git", ["-C", cwd, "status", "--short"], {
    cwd,
    logFile: path.join(cwd, "logs", "autonomous", "git-status.log"),
    label: "git.status",
  });
  return result.output;
}

async function runGitCommit(cwd: string): Promise<boolean> {
  const status = (await runCommand("git", ["-C", cwd, "status", "--short"], {
    cwd,
    logFile: path.join(cwd, "logs", "autonomous", "git-status.log"),
    label: "git.status",
  })).output;

  if (!status.trim()) {
    return false;
  }

  await runCommand("git", ["-C", cwd, "add", "."], {
    cwd,
    logFile: path.join(cwd, "logs", "autonomous", "git-commit.log"),
    label: "git.add",
  });

  const message = `chore(autonomous): autonomous ops snapshot ${new Date().toISOString()}`;
  await runCommand("git", ["-C", cwd, "commit", "-m", message], {
    cwd,
    logFile: path.join(cwd, "logs", "autonomous", "git-commit.log"),
    label: "git.commit",
  });

  return true;
}

async function runHealthCheck(url: string): Promise<{ status: number; ok: boolean; bodyPreview: string }> {
  const started = Date.now();
  const response = await fetch(url, { redirect: "manual", cache: "no-store", headers: { "User-Agent": "autonomous-ops-loop/1.0" } });
  const status = response.status;
  const text = await response.text();
  return {
    status,
    ok: response.ok,
    bodyPreview: text.slice(0, 200).replace(/\r?\n/g, " "),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const durationMinutes = parsePositiveInt(args.durationMinutes, DEFAULT_DURATION_MINUTES);
  const cycleMinutes = parsePositiveInt(args.cycleMinutes, DEFAULT_CYCLE_MINUTES);
  const autoCommit = boolValue(args.autoCommit, false);
  const runIngest = boolValue(args.ingest, true);
  const runRefactor = boolValue(args.refactor, true);
  const runApiAudits = boolValue(args.apiAudits, true);
  const healthProbe = args.healthUrl || DEFAULT_HEALTH_URL;
  const phases = (args.phases || DEFAULT_INGEST_PHASES).toUpperCase();
  const repoRoot = path.resolve(process.cwd());
  const logDir = path.join(repoRoot, "logs", "autonomous");
  const logPath = path.join(logDir, `autonomous-ops-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  const reportPath = path.join(logDir, `autonomous-ops-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const cycleLimitMs = cycleMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const startedAt = new Date();

  mkdirSync(logDir, { recursive: true });
  await fs.appendFile(logPath, `[${startedAt.toISOString()}] autonomous loop started. duration=${durationMinutes}m cycle=${cycleMinutes}m\n`, "utf8");

  const summary: LoopSummary = {
    startedAt: startedAt.toISOString(),
    durationMinutes,
    cycleMinutes,
    completedCycles: 0,
    stopReason: "duration",
    tasks: [],
    healthChecks: [],
  };

  let stopRequested = false;
  process.on("SIGINT", () => {
    stopRequested = true;
    summary.stopReason = "signal";
  });
  process.on("SIGTERM", () => {
    stopRequested = true;
    summary.stopReason = "signal";
  });

  const children: ChildProcessWithoutNullStreams[] = [];

  if (runIngest) {
    const ingestLog = path.join(logDir, "ingest-loop.log");
    const args = ["run", "ingest:top20:agents", "--", `--durationMinutes=${durationMinutes}`, `--interval=20`, `--phases=${phases}`];
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const runner = spawn(command, args, {
      cwd: repoRoot,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;
    const ingestStream = createWriteStream(ingestLog, { flags: "a" });
    children.push(runner);
    const prefix = `[${new Date().toISOString()}][ingest] `;
    runner.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      ingestStream.write(prefix + text);
      process.stdout.write(prefix + text);
    });
    runner.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      ingestStream.write(prefix + text);
      process.stderr.write(prefix + text);
    });
    runner.on("close", () => ingestStream.end());
    await fs.appendFile(logPath, `[${new Date().toISOString()}] ingest supervisor started. phases=${phases}\n`, "utf8");
  }

  const endAt = Date.now() + durationMs;
  let cycle = 0;

  while (!stopRequested && Date.now() < endAt) {
    cycle += 1;
    const cycleStart = new Date();
    const tasks: string[] = [];

    if (runRefactor) {
      tasks.push("npm:refactor:loop");
      const taskStart = Date.now();
      const res = await runCommand("npm", ["run", "refactor:loop"], {
        cwd: repoRoot,
        logFile: path.join(logDir, `cycle-${cycle}-refactor.log`),
        label: `cycle-${cycle}-refactor`,
      });
      summary.tasks.push({
        cycle,
        startedAt: cycleStart.toISOString(),
        endedAt: new Date().toISOString(),
        command: "npm run refactor:loop",
        exitCode: res.exitCode,
        durationMs: Date.now() - taskStart,
        output: res.output,
      });
    }

    if (runApiAudits) {
      const taskStart = Date.now();
      const auditCmd = "npm run api:contract-audit && npm run api:contract-sync-audit";
      const child = spawn(process.platform === "win32" ? "cmd.exe" : "/bin/sh",
        process.platform === "win32" ? ["/c", auditCmd] : ["-lc", auditCmd],
        { cwd: repoRoot, shell: true, stdio: ["ignore", "pipe", "pipe"] });

      const childProcess = child as ChildProcessWithoutNullStreams;
      const chunks: string[] = [];
      const logFile = path.join(logDir, `cycle-${cycle}-api-audit.log`);
      const stream = createWriteStream(logFile, { flags: "a" });
      const prefix = `[${new Date().toISOString()}][cycle-${cycle}-api-audit] `;
      childProcess.stdout?.on("data", (chunk) => {
        const text = chunk.toString();
        chunks.push(`stdout: ${text}`);
        stream.write(prefix + text);
        process.stdout.write(prefix + text);
      });
      childProcess.stderr?.on("data", (chunk) => {
        const text = chunk.toString();
        chunks.push(`stderr: ${text}`);
        stream.write(prefix + text);
        process.stderr.write(prefix + text);
      });

      const exitCode = await new Promise<number>((resolve, reject) => {
        childProcess.on("error", reject);
        childProcess.on("close", (code) => resolve(code ?? 0));
      });
      stream.end();

      summary.tasks.push({
        cycle,
        startedAt: cycleStart.toISOString(),
        endedAt: new Date().toISOString(),
        command: auditCmd,
        exitCode,
        durationMs: Date.now() - taskStart,
        output: chunks.join(""),
      });

      if (exitCode !== 0) {
        await fs.appendFile(logPath, `[${new Date().toISOString()}] api audit failed cycle=${cycle}, exit=${exitCode}.\n`, "utf8");
      }
    }

    try {
      const check = await runHealthCheck(healthProbe);
      summary.healthChecks.push({
        timestamp: new Date().toISOString(),
        status: check.status,
        ok: check.ok,
        url: healthProbe,
        bodyPreview: check.bodyPreview,
      });
      await fs.appendFile(logPath, `[${new Date().toISOString()}] health ${healthProbe} -> ${check.status} ok=${check.ok}\n`, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await fs.appendFile(logPath, `[${new Date().toISOString()}] health check error: ${message}\n`, "utf8");
    }

    if (autoCommit) {
      const hadChanges = await runGitCommit(repoRoot);
      if (hadChanges) {
        await fs.appendFile(logPath, `[${new Date().toISOString()}] cycle ${cycle}: auto committed updates.\n`, "utf8");
      }
    }

    summary.completedCycles += 1;

    const elapsed = Date.now() - cycleStart.getTime();
    const remain = endAt - Date.now();
    const nextDelay = Math.min(cycleLimitMs - elapsed, remain, cycleLimitMs);
    if (nextDelay > 0 && !stopRequested && Date.now() + 1000 < endAt) {
      await sleep(Math.max(5_000, nextDelay));
    }
  }

  if (children.length > 0) {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGINT");
        await sleep(500);
      }
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    await sleep(500);
  }

  summary.endedAt = new Date().toISOString();
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), "utf8");
  await fs.appendFile(logPath, `[${summary.endedAt}] autonomous loop done. completedCycles=${summary.completedCycles} stopReason=${summary.stopReason}\n`, "utf8");
  await fs.appendFile(logPath, `[report] ${reportPath}\n`, "utf8");

  const status = await runGitStatus(repoRoot);
  if (status.trim()) {
    await fs.appendFile(logPath, `[${new Date().toISOString()}] final git status:\n${status}\n`, "utf8");
  }
}

main().catch(async (error) => {
  const repoRoot = process.cwd();
  const logDir = path.join(repoRoot, "logs", "autonomous");
  const message = error instanceof Error ? error.message : String(error);
  mkdirSync(logDir, { recursive: true });
  await fs.appendFile(path.join(logDir, "autonomous-ops-errors.log"), `[${new Date().toISOString()}] ${message}\n`, "utf8");
  process.stderr.write(`autonomous-ops failed: ${message}\n`);
  process.exit(1);
});
