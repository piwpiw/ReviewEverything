import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type AgentMode = {
  name: string;
  phase: string;
};

type RawArgs = Record<string, string | undefined>;

type StopReason = "signal" | "duration" | "manual";

type ActiveAgent = {
  child: ChildProcessWithoutNullStreams;
  phase: string;
  name: string;
  index: number;
};

const DEFAULT_PHASES = ["A", "B", "C"];
const DEFAULT_LIMIT = 12;
const DEFAULT_INTERVAL_MINUTES = 20;
const DEFAULT_DURATION_MINUTES = 180;
const DEFAULT_LOG_DIR = "./logs/top20-agents";
const DEFAULT_RESTART_DELAY_MS = 20_000;

function parseArgMap(argv: string[]) {
  const parsed: RawArgs = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue] = arg.replace(/^--/, "").split("=", 2);
    parsed[rawKey.trim()] = rawValue !== undefined ? rawValue.trim() : "true";
  }

  return parsed;
}

function parsePhases(raw: string | undefined) {
  if (!raw) return [...DEFAULT_PHASES];
  const unique = new Set<string>();

  for (const phase of raw
    .split(",")
    .map((phase) => phase.trim().toUpperCase())
    .filter(Boolean)) {
    unique.add(phase);
  }

  return Array.from(unique);
}

function parseIntArg(raw: string | undefined, fallback: number) {
  const parsed = Number.parseInt(raw || String(fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[]) {
  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function buildAgentCommand(
  phase: string,
  options: {
    limit: number;
    intervalMinutes: number;
    durationMinutes: number;
    logFile: string;
    reminder: boolean;
    iterations?: number;
    platformKeys?: string;
  },
) {
  const args = [
    "run",
    "ingest:top20",
    "--",
    `--phases=${phase}`,
    `--iterations=999999`,
    `--limit=${options.limit}`,
    `--interval=${options.intervalMinutes}`,
    `--durationMinutes=${options.durationMinutes}`,
    `--log_file=${options.logFile}`,
    `--reminder=${options.reminder}`,
  ];

  if (options.iterations !== undefined && Number.isFinite(options.iterations) && options.iterations > 0) {
    args.push(`--iterations=${options.iterations}`);
  }

  if (options.platformKeys) {
    args.push(`--platform_keys=${options.platformKeys}`);
  }

  return args;
}

async function main() {
  const args = parseArgMap(process.argv.slice(2));
  const phases = parsePhases(args.phases || args.phase || "");
  const limit = parseIntArg(args.limit, DEFAULT_LIMIT);
  const intervalMinutes = parseIntArg(args.interval, DEFAULT_INTERVAL_MINUTES);
  const durationMinutes = parseIntArg(args.durationMinutes, DEFAULT_DURATION_MINUTES);
  const logDir = args.logDir || args.log_dir || DEFAULT_LOG_DIR;
  const allowRestart = String(args.restart || "true").toLowerCase() !== "false";
  const restartDelayMs = parseIntArg(args.restartDelayMs, DEFAULT_RESTART_DELAY_MS);
  const iterations = args.iterations ? parseIntArg(args.iterations, 0) : undefined;
  const platformKeys = args.platform_keys || args.platformKeys || args.platformKey;
  const runner = process.platform === "win32" ? "npm.cmd" : "npm";

  fs.mkdirSync(path.resolve(logDir), { recursive: true });

  const startedAt = new Date().toISOString();
  const stopAt = Date.now() + durationMinutes * 60 * 1000;

  console.log(
    `[top20-agents] started=${startedAt} phases=${phases.join(",")} duration=${durationMinutes}m restart=${allowRestart}`,
  );

  const agents: AgentMode[] = phases.map((phase) => ({
    name: `agent-${phase.toLowerCase()}`,
    phase,
  }));

  const running = new Map<string, ActiveAgent>();
  const exitHistory: Record<string, string[]> = {};
  let stopReason: StopReason = "manual";
  let isStopping = false;

  const finalStop: () => void = () => {
    if (isStopping) return;
    isStopping = true;
    stopReason = "signal";
    console.log("[top20-agents] stop requested. terminating active agents...");
  };

  process.on("SIGINT", finalStop);
  process.on("SIGTERM", finalStop);

  const stopByDuration = setTimeout(() => {
    if (!isStopping) {
      isStopping = true;
      stopReason = "duration";
      console.log("[top20-agents] duration boundary reached. terminating active agents...");
    }
  }, Math.max(0, stopAt - Date.now()));

  const startAgent = (agent: AgentMode, index: number): ChildProcessWithoutNullStreams => {
    const remainingMinutes = Math.max(1, Math.floor((stopAt - Date.now()) / 60000));
    const logFile = path.join(logDir, `${agent.name}.log`);
    const commandArgs = buildAgentCommand(agent.phase, {
      limit,
      intervalMinutes,
      durationMinutes: remainingMinutes,
      logFile,
      reminder: index === 0,
      iterations,
      platformKeys,
    });

    const child = runCommand(runner, commandArgs);
    running.set(agent.name, { child, phase: agent.phase, name: agent.name, index });
    exitHistory[agent.name] = [];

    console.log(`[top20-agents] ${agent.name} started (${agent.phase}) -> npm ${commandArgs.join(" ")}`);

    child.on("exit", (code, signal) => {
      const reason = signal ? `signal:${signal}` : `code:${code}`;
      running.delete(agent.name);
      exitHistory[agent.name].push(reason);
      console.log(`[top20-agents] ${agent.name} exited (${reason})`);

      if (isStopping) return;
      if (!allowRestart) return;
      if (Date.now() >= stopAt) return;

      const nextRemainingMinutes = Math.max(1, Math.floor((stopAt - Date.now()) / 60000));
      console.log(
        `[top20-agents] ${agent.name} restarting in ${Math.round(restartDelayMs / 1000)}s, remaining ${nextRemainingMinutes}m`,
      );
      void sleep(restartDelayMs).then(() => {
        if (!isStopping && Date.now() < stopAt) {
          void startAgent(agent, index);
        }
      });
    });

    child.on("error", (error) => {
      running.delete(agent.name);
      exitHistory[agent.name].push(`error:${error.message}`);
      console.error(`[top20-agents] ${agent.name} spawn error: ${error.message}`);

      if (isStopping || !allowRestart || Date.now() >= stopAt) return;

      void sleep(restartDelayMs).then(() => {
        if (!isStopping && Date.now() < stopAt) {
          void startAgent(agent, index);
        }
      });
    });

    return child;
  };

  agents.forEach((agent, index) => {
    void startAgent(agent, index);
  });

  while (!isStopping) {
    await sleep(500);
  }

  clearTimeout(stopByDuration);

  if (running.size > 0) {
    for (const { child, name } of running.values()) {
      console.log(`[top20-agents] killing ${name}`);
      child.kill("SIGTERM");
    }

    await sleep(2_000);

    for (const { child, name } of running.values()) {
      if (child.exitCode === null) {
        console.log(`[top20-agents] force killing ${name}`);
        child.kill("SIGKILL");
      }
    }
  }

  console.log(
    `[top20-agents] done. stopReason=${stopReason} phases=${phases.join(",")} logDir=${path.resolve(logDir)}`,
  );
  for (const [agentName, reasons] of Object.entries(exitHistory)) {
    const ordered = reasons.length > 0 ? reasons.join(", ") : "started only";
    console.log(`- ${agentName}: ${ordered}`);
  }
}

main().catch((error) => {
  console.error("[top20-agents] failed", error);
  process.exit(1);
});
