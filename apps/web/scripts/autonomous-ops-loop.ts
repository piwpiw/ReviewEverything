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
  ingestRestarts: number;
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
const REVIEW_WORKLIST_FILE = "AUTONOMOUS_REVIEW_WORKLIST.md";
const REVIEW_TOPICS = [
  "Top20 플랫폼 수집 정책 검토: list/detail 패턴 점검 항목화",
  "DB 스키마 정합성: Campaign/Creator/Reward/Platform 키 중복 기준 점검",
  "자동로그인 재시도 정책: 에러 코드별 실패 라벨/표시 메시지 매핑 검토",
  "운영 화면 알림 우선순위: 경고/실패/완료 토스트 문안 정합성 검토",
  "크롤러 안전성: robots/약관 변경 대응 플래그 업데이트 체크리스트",
  "배치 모니터링: cycle별 ingest 실패율 임계치 알림 기준 조정안",
  "중복 제거 정책: 업체명 정규화/카테고리/지역 정합성 규칙 보강",
  "실행 로그 표준화: 로그 템플릿, 종료 사유, 재시작 이력 기록 포맷 정비",
  "운영 승인 루틴: agent:review 통과 후 배포 전 로컬 검증 강화",
  "TOP20 확장 소스: punycode/회원 전용 도메인/로그인 의존 항목 정리",
];

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

function formatKoreanDate(date: Date) {
  return `${date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false })}`;
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

async function runHealthCheck(url: string): Promise<{ status: number; ok: boolean; url: string; bodyPreview: string }> {
  const response = await fetch(url, { redirect: "manual", cache: "no-store", headers: { "User-Agent": "autonomous-ops-loop/1.0" } });
  const status = response.status;
  const text = await response.text();
  return {
    status,
    ok: response.ok,
    url,
    bodyPreview: text.slice(0, 200).replace(/\r?\n/g, " "),
  };
}

async function appendReviewWorklist(input: {
  cwd: string;
  cycle: number;
  cycleMinutes: number;
  runAt: Date;
  completedCycles: number;
  logPath: string;
}) {
  const worklistPath = path.join(input.cwd, "docs", REVIEW_WORKLIST_FILE);
  const startIndex = Math.max(0, input.completedCycles % REVIEW_TOPICS.length);
  const selected = REVIEW_TOPICS.slice(startIndex, startIndex + 3);
  if (selected.length < 3) {
    selected.push(...REVIEW_TOPICS.slice(0, 3 - selected.length));
  }

  const section = [
    `## [${formatKoreanDate(input.runAt)}] 리뷰 작업리스트 사이클 ${input.cycle}`,
    `- 주기: ${input.cycleMinutes}분`,
    "- 검토 항목",
    ...selected.map((item, index) => `  - [ ] ${item} (우선순위 ${index + 1})`),
    "- 증분 메모: 자동 수집/디비 반영 전 검토 대상만 식별, 즉시 구현은 다음 사이클 배분",
    "",
  ].join("\n");

  await fs.appendFile(worklistPath, `\n${section}`, "utf8");
  await fs.appendFile(input.logPath, `[${new Date().toISOString()}] review worklist written: ${worklistPath}\n`, "utf8");

  return section;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const durationMinutes = parsePositiveInt(args.durationMinutes, DEFAULT_DURATION_MINUTES);
  const cycleMinutes = parsePositiveInt(args.cycleMinutes, DEFAULT_CYCLE_MINUTES);
  const autoCommit = boolValue(args.autoCommit, false);
  const reviewOnly = boolValue(args.reviewOnly, false);
  const runIngest = reviewOnly ? false : boolValue(args.ingest, true);
  const runRefactor = reviewOnly ? false : boolValue(args.refactor, true);
  const runApiAudits = reviewOnly ? false : boolValue(args.apiAudits, true);
  const healthProbe = args.healthUrl || DEFAULT_HEALTH_URL;
  const runHealth = reviewOnly ? boolValue(args.healthCheck, false) : boolValue(args.healthCheck, true);
  const phases = (args.phases || DEFAULT_INGEST_PHASES).toUpperCase();
  const ingestRestartDelayMs = parsePositiveInt(args.ingestRestartDelayMs, 20_000);
  const repoRoot = path.resolve(process.cwd());
  const logDir = path.join(repoRoot, "logs", "autonomous");
  const logPath = path.join(logDir, `autonomous-ops-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  const reportPath = path.join(logDir, `autonomous-ops-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const cycleLimitMs = cycleMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const startedAt = new Date();
  const endAt = Date.now() + durationMs;

  mkdirSync(logDir, { recursive: true });
  await fs.appendFile(logPath, `[${startedAt.toISOString()}] autonomous loop started. duration=${durationMinutes}m cycle=${cycleMinutes}m reviewOnly=${reviewOnly}\n`, "utf8");

  const summary: LoopSummary = {
    startedAt: startedAt.toISOString(),
    durationMinutes,
    cycleMinutes,
    completedCycles: 0,
    ingestRestarts: 0,
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

  const ingestLog = path.join(logDir, "ingest-loop.log");
  const runner = process.platform === "win32" ? "npm.cmd" : "npm";
  let activeIngest: ChildProcessWithoutNullStreams | null = null;
  let ingestStopRequested = false;

  const launchIngest = async (isRestart = false): Promise<void> => {
    if (isRestart) {
      summary.ingestRestarts += 1;
    }

    const remainingMinutes = Math.max(1, Math.floor((endAt - Date.now()) / 60_000));
    const args = [
      "run",
      "ingest:top20:agents",
      "--",
      `--durationMinutes=${remainingMinutes}`,
      `--interval=20`,
      `--phases=${phases}`,
    ];
    const child = spawn(runner, args, {
      cwd: repoRoot,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;
    const label = isRestart ? "ingest-restart" : "ingest-start";
    const stream = createWriteStream(ingestLog, { flags: "a" });
    const prefix = `[${new Date().toISOString()}][ingest] `;

    activeIngest = child;
    await fs.appendFile(
      logPath,
      `[${new Date().toISOString()}] ingest ${label} launched. remainingMinutes=${remainingMinutes} phases=${phases}\n`,
      "utf8",
    );

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stream.write(prefix + text);
      process.stdout.write(prefix + text);
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stream.write(prefix + text);
      process.stderr.write(prefix + text);
    });
    child.on("close", (code, signal) => {
      stream.end();
      const exitInfo = signal ? `signal:${signal}` : `code:${code}`;
      void fs.appendFile(logPath, `[${new Date().toISOString()}] ingest ${label} ended (${exitInfo}). remainingMs=${Math.max(0, endAt - Date.now())}\n`, "utf8");
      if (ingestStopRequested || stopRequested) return;
      if (Date.now() >= endAt) return;
      void sleep(ingestRestartDelayMs).then(() => {
        if (!ingestStopRequested && !stopRequested && Date.now() < endAt) {
          void launchIngest(true);
        }
      });
    });
    child.on("error", (error) => {
      stream.end();
      void fs.appendFile(logPath, `[${new Date().toISOString()}] ingest ${label} error: ${error.message}\n`, "utf8");
      if (ingestStopRequested || stopRequested) return;
      if (Date.now() >= endAt) return;
      void sleep(ingestRestartDelayMs).then(() => {
        if (!ingestStopRequested && !stopRequested && Date.now() < endAt) {
          void launchIngest(true);
        }
      });
    });
  };

  if (runIngest) {
    await fs.appendFile(logPath, `[${new Date().toISOString()}] ingest supervisor starting. phases=${phases}\n`, "utf8");
    void launchIngest(false);
  }

  let cycle = 0;
  while (!stopRequested && Date.now() < endAt) {
    cycle += 1;
    const cycleStart = new Date();
    const taskResults: LoopSummary["tasks"] = [];
    const runCycleTasks: Promise<void>[] = [];

    if (runRefactor) {
      runCycleTasks.push(
        (async () => {
          const taskStart = Date.now();
          const res = await runCommand("npm", ["run", "refactor:loop"], {
            cwd: repoRoot,
            logFile: path.join(logDir, `cycle-${cycle}-refactor.log`),
            label: `cycle-${cycle}-refactor`,
          });
          taskResults.push({
            cycle,
            startedAt: cycleStart.toISOString(),
            endedAt: new Date().toISOString(),
            command: "npm run refactor:loop",
            exitCode: res.exitCode,
            durationMs: Date.now() - taskStart,
            output: res.output,
          });
        })(),
      );
    }

    if (runApiAudits) {
      runCycleTasks.push(
        (async () => {
          const taskStart = Date.now();
          const chunks: string[] = [];
          let exitCode = 0;
          const logFile = path.join(logDir, `cycle-${cycle}-api-audit.log`);
          const stream = createWriteStream(logFile, { flags: "a" });
          const prefix = `[${new Date().toISOString()}][cycle-${cycle}-api-audit] `;
          const emit = (target: "stdout" | "stderr", text: string) => {
            chunks.push(`${target}: ${text}`);
            stream.write(prefix + text);
            if (target === "stderr") {
              process.stderr.write(prefix + text);
            } else {
              process.stdout.write(prefix + text);
            }
          };

          const audit1 = await runCommand("npm", ["run", "api:contract-audit"], {
            cwd: repoRoot,
            logFile: path.join(logDir, `cycle-${cycle}-api-contract-audit.log`),
            label: `cycle-${cycle}-api-contract-audit`,
          });
          if (audit1.output) emit("stdout", audit1.output);
          const audit2 = await runCommand("npm", ["run", "api:contract-sync-audit"], {
            cwd: repoRoot,
            logFile: path.join(logDir, `cycle-${cycle}-api-contract-sync-audit.log`),
            label: `cycle-${cycle}-api-contract-sync-audit`,
          });
          if (audit2.output) emit("stdout", audit2.output);
          exitCode = audit1.exitCode === 0 ? audit2.exitCode : audit1.exitCode;
          stream.end();

          taskResults.push({
            cycle,
            startedAt: cycleStart.toISOString(),
            endedAt: new Date().toISOString(),
            command: "npm run api:contract-audit && npm run api:contract-sync-audit",
            exitCode,
            durationMs: Date.now() - taskStart,
            output: chunks.join(""),
          });

          if (exitCode !== 0) {
            await fs.appendFile(logPath, `[${new Date().toISOString()}] api audit failed cycle=${cycle}, exit=${exitCode}.\n`, "utf8");
          }
        })(),
      );
    }

    if (reviewOnly) {
      runCycleTasks.push(
        (async () => {
          const taskStart = Date.now();
          const section = await appendReviewWorklist({
            cwd: repoRoot,
            cycle,
            cycleMinutes,
            runAt: cycleStart,
            completedCycles: summary.completedCycles,
            logPath,
          });
          taskResults.push({
            cycle,
            startedAt: cycleStart.toISOString(),
            endedAt: new Date().toISOString(),
            command: "review-worklist",
            exitCode: 0,
            durationMs: Date.now() - taskStart,
            output: section,
          });
        })(),
      );
    }

    await Promise.all(runCycleTasks);
    summary.tasks.push(...taskResults);

    if (runHealth) {
      try {
        const check = await runHealthCheck(healthProbe);
        summary.healthChecks.push({
          timestamp: new Date().toISOString(),
          status: check.status,
          ok: check.ok,
          url: check.url,
          bodyPreview: check.bodyPreview,
        });
        await fs.appendFile(logPath, `[${new Date().toISOString()}] health ${healthProbe} -> ${check.status} ok=${check.ok}\n`, "utf8");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await fs.appendFile(logPath, `[${new Date().toISOString()}] health check error: ${message}\n`, "utf8");
      }
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

  ingestStopRequested = true;
  if (activeIngest && !activeIngest.killed) {
    activeIngest.kill("SIGINT");
    await sleep(500);
    if (!activeIngest.killed) {
      activeIngest.kill("SIGKILL");
    }
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
