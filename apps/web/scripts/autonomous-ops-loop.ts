import { spawn, type ChildProcess } from "node:child_process";
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
type TaskSnapshot = {
  cycle: number;
  startedAt: string;
  endedAt: string;
  command: string;
  exitCode: number;
  output: string;
};
type HourlyWindow = {
  windowStartMs: number;
  cycles: TaskSnapshot[];
};

const DEFAULT_DURATION_MINUTES = 300;
const DEFAULT_CYCLE_MINUTES = 20;
const DEFAULT_REPORT_INTERVAL_MINUTES = 60;
const DEFAULT_REVIEW_PARALLELISM = 1;
const DEFAULT_REVIEW_TASKS_PER_HOUR = 100;
const REVIEW_ITEMS_PER_SHARD = 3;
const REVIEW_DETAIL_STEPS = [
  "리뷰 노출/공정성 검증",
  "요건 정합성 점검",
  "오류 처리 가이드",
  "DB 적재 구조 점검",
  "브라우저 호환성 확인",
  "빈값/만료/중복 처리 검토",
  "파이프라인 실패율 및 대기열 재시도 로직 점검",
  "API 응답 스키마 회귀 검증",
  "운영/모니터링 대시보드 경보 룰 점검",
  "필터/정렬/검색 UX 일관성 점검",
  "동시성/경합 처리 경계 테스트",
  "페이지 기능 공백 탐색: 빈 상태/오류 상태/로딩 상태의 최소 1개 실측 항목 보강",
  "페이지별 메시지 규격 정합성: 정상/주의/위험/중단 라벨을 화면 텍스트로 통일",
  "오류 복구 루프 점검: 실패 시 1회 재시도, 재시도 실패시 사용자 안내 CTA 점검",
  "중복 기능 제거: 동일 액션(수집 실행/리프레시/재시도) 텍스트/아이콘/동작 일관성 통합",
  "UI 개선: 목록/상세/관리자 화면 스켈레톤·오류·빈 상태 UX 개선",
  "UI 개선: 목록→상세 전환 퍼널과 CTA 우선순위 검증",
  "UI 개선: 관리자 일괄 처리 및 상태 라벨 UX 정합성 점검",
  "운영성 검토: 작업 로그 및 실행 결과 표기 개선"
];
const DEFAULT_HEALTH_URL = "https://revieweverything-web-piwpiw99.vercel.app/api/health";
const DEFAULT_INGEST_PHASES = "A,B,C";
const REVIEW_WORKLIST_FILE = "AUTONOMOUS_REVIEW_WORKLIST.md";
const REVIEW_WORK_POOL_FILE = "AUTONOMOUS_WORK_POOL.md";
const REVIEW_SUMMARY_FILE = "AUTONOMOUS_HOURLY_REPORT.md";
const REVIEW_TOPICS = [
  "Top20 체험단 목록 정합성 검토",
  "DB 적재 대상: Campaign/Creator/Reward/Platform 스키마 정합성 점검",
  "크롤링 중복 제거: 캠페인/브랜드/기간 기준 추출 정책 점검",
  "운영 오류 대비: 실패/예외 로그·알림 정책 점검",
  "robots/약관/접근 제한 정책 점검",
  "실행 주기 운영: cycle별 ingest 큐 소진률 모니터링",
  "중복/스팸 처리: 동일 키 정제 및 휴리스틱 개선",
  "요청 처리 큐: 초과 지연·재시도 제한 정책 점검",
  "리뷰어 운영 UX: 대시보드 상태 라벨 가독성 향상",
  "TOP20 소스 우선순위: punycode/지역 기반 파싱 정책",
  "UI 개선: 대시보드 목록 필터/상태 라벨 가독성 점검",
  "UI 개선: 상세 페이지 전환 명확성 및 재시도 복구 플로우 점검",
  "UI 개선: 관리자 캠페인 테이블 상호작용(정렬/필터/편집) 일관성 점검",
  "UI 개선: 페이지별(홈/상세/지도/관리자/시스템/ME) 미달 기준 점검 및 즉시 개선안 생성",
  "운영 안정성: 급증 트래픽 시 자동 확장/비정상 탐지 알림 정책",
  "화면 진단(홈): 필터/정렬/빈 상태/에러 배너/재시도 CTA의 실측 항목 누락 여부",
  "화면 진단(상세): D-day/보상/지역/관련 캠페인 탭/링크 상태의 오동작 및 폴백 문구 점검",
  "화면 진단(지도): 지도 뷰 fallback, 권한 거부 처리, 지역/필터 변경 반영 지연 점검",
  "화면 진단(관리자): /admin 목록 빈값 처리, 수집 진행 상태 라벨(요청/진행/완료) 일치성 점검",
  "화면 진단(시스템): 경보 액션 실패 재시도, 경보 상세 액션Path 일치성, 건강도 메트릭 폴백 점검",
  "화면 진단(/me): 사용자 ID/탭 유지, 일정/알림 플로우 오류 복구, 데이터 미존재시 안내 메시지 점검",
  "화면 진단(광고주 페이지): 비즈니스 CTA 동선, 파트너 신청 동작 상태, KPI 문구와 실제 기능 연동 점검",
  "기능 중복 제거: 페이지별 동일 상태 라벨/색상/메시지 규칙 통합 (정상/주의/위험/중단)"
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

async function getLastTaskNoFromWorkPool(workPoolPath: string): Promise<number> {
  try {
    const existing = await fs.readFile(workPoolPath, "utf8");
    const patterns = [
      /작업번호\s*(\d{1,6})/g,
      /^\s*-\s*\[\s\]\s*(\d{1,6})\b/gm,
    ];
    let max = 0;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null = null;
      while ((match = pattern.exec(existing)) !== null) {
        const parsed = Number.parseInt(match[1], 10);
        if (Number.isFinite(parsed)) max = Math.max(max, parsed);
      }
    }
    return max;
  } catch {
    return 0;
  }
}

async function ensureWorkPoolFile(workPoolPath: string) {
  if (existsSync(workPoolPath)) return;
  await fs.writeFile(
    workPoolPath,
    [
      "# REVIEW 작업 목록 (AUTONOMOUS)",
      "- review-only 루프에서 생성/개선 작업을 누적 관리하고 이력으로 추적합니다.",
      "",
    ].join("\n"),
    "utf8",
  );
}

async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; logFile: string; label: string },
): Promise<{ exitCode: number; output: string }> {
  const runner = command;
  const child = spawn(runner, args, {
    cwd: options.cwd,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  }) as ChildProcess;

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
  logPath: string;
  shardIndex: number;
  shardCount: number;
  workPoolStartNo: number;
  taskStartNo: number;
  tasksForShard: number;
  tasksPerHour: number;
}) {
  const safeShards = Math.max(1, Math.min(input.shardCount, Math.max(1, Math.floor(REVIEW_TOPICS.length / REVIEW_ITEMS_PER_SHARD))));
  const tasksPerShard = Math.max(0, input.tasksForShard);
  const workPoolPath = path.join(input.cwd, "docs", REVIEW_WORK_POOL_FILE);
  const selected: string[] = [];
  for (let index = 0; index < tasksPerShard; index += 1) {
    const taskNo = input.taskStartNo + index;
    const globalIndex = taskNo - input.workPoolStartNo;
    const topic = REVIEW_TOPICS[globalIndex % REVIEW_TOPICS.length];
    const action = REVIEW_DETAIL_STEPS[globalIndex % REVIEW_DETAIL_STEPS.length];
    selected.push(`${topic} / ${action} (작업번호 ${String(taskNo).padStart(3, "0")})`);
  }
  const worklistPath = path.join(input.cwd, "docs", REVIEW_WORKLIST_FILE);

  const section = [
    `## [${formatKoreanDate(input.runAt)}] 리뷰 작업리스트 생성기록 ${input.cycle} (${input.shardIndex + 1}/${safeShards})`,
    `- 주기: ${input.cycleMinutes}분`,
    `- 배분: 시간당 목표 ${input.tasksPerHour}개 (분기당 ${tasksPerShard}개)`,
    "- 검토 항목",
    ...selected.map((item, index) => `  - [ ] ${item} (우선순위 ${index + 1}, 분기 ${input.shardIndex + 1}/${safeShards})`),
    "- 증분 메모: 운영 수집/수정 반영 시 이슈만 표시하고, 즉시 구현 우선순위로 배분",
    "",
  ].join("\n");
  const poolSection = [
    `## [${formatKoreanDate(input.runAt)}] 리뷰 작업풀이 생성됨 ${input.cycle} (${input.shardIndex + 1}/${safeShards})`,
    `- 주기 ${input.cycle}, 분할: ${input.shardIndex + 1}/${safeShards}`,
    ...selected.map((item, index) => {
      const taskNo = input.taskStartNo + index;
      return `  - [ ] ${String(taskNo).padStart(3, "0")} ${item}`;
    }),
    "",
  ].join("\n");

  await fs.appendFile(worklistPath, `\n${section}`, "utf8");
  await fs.appendFile(workPoolPath, `\n${poolSection}`, "utf8");
  await fs.appendFile(input.logPath, `[${new Date().toISOString()}] review worklist written: ${worklistPath}\n`, "utf8");

  return section;
}

function extractReviewItems(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ]"))
    .map((line) => line.replace(/^- \[ \] /, ""))
    .map((line) => line.replace(/\(우선순위 \d+[^)]*\)/, "").trim())
    .filter(Boolean);
}

async function appendHourlyReport(input: {
  repoRoot: string;
  logPath: string;
  cycleMinutes: number;
  window: HourlyWindow;
  cycleRangeFrom: number;
  cycleRangeTo: number;
  reportIntervalMinutes: number;
  reviewTasksPerHour: number;
}) {
  const reportPath = path.join(input.repoRoot, "docs", REVIEW_SUMMARY_FILE);
  const windowStart = new Date(input.window.windowStartMs);
  const windowEnd = new Date(input.window.windowStartMs + input.reportIntervalMinutes * 60_000);
  const startText = `${String(windowStart.getFullYear())}-${String(windowStart.getMonth() + 1).padStart(2, "0")}-${String(windowStart.getDate()).padStart(2, "0")} ${String(windowStart.getHours()).padStart(2, "0")}:00`;
  const endText = `${String(windowEnd.getHours()).padStart(2, "0")}:00`;

  const reviewEntries = input.window.cycles.filter((entry) => entry.command.startsWith("review-worklist"));
  const workItems = reviewEntries.flatMap((entry) => extractReviewItems(entry.output));
  const workItemUniques = Array.from(new Set(workItems));
  const targetPerHour = input.reviewTasksPerHour;

  const commandCounts: Record<string, number> = {};
  for (const entry of input.window.cycles) {
    commandCounts[entry.command] = (commandCounts[entry.command] ?? 0) + 1;
  }
  const commandSummary = Object.entries(commandCounts)
    .map(([command, count]) => `${command}=${count}`)
    .join(", ");

  const section = [
    `## ${startText} ~ ${endText}`,
    `- 실행 주기: ${input.cycleMinutes}분`,
    `- 실행 기간: ${input.cycleRangeFrom} ~ ${input.cycleRangeTo}`,
    `- 실행 횟수: ${input.window.cycles.length}`,
    `- 리뷰 항목 수: ${workItems.length}`,
    `- 리뷰 목표: ${targetPerHour}개/시간`,
    `- command 분포: ${commandSummary || "none"}`,
    "- 검토 기록:",
  ];
  if (workItemUniques.length > 0) {
    section.push(...workItemUniques.slice(0, 30).map((item) => `  - ${item}`));
  } else {
    section.push("  - (이전 주기 검토 기록 없음)");
  }
  section.push("");

  await fs.appendFile(reportPath, `\n${section.join("\n")}\n`, "utf8");
  await fs.appendFile(input.logPath, `[${new Date().toISOString()}] hourly report written: ${reportPath}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const durationMinutes = parsePositiveInt(args.durationMinutes, DEFAULT_DURATION_MINUTES);
  const cycleMinutes = parsePositiveInt(args.cycleMinutes, DEFAULT_CYCLE_MINUTES);
  const reportIntervalMinutes = parsePositiveInt(args.reportIntervalMinutes, DEFAULT_REPORT_INTERVAL_MINUTES);
  const reviewTasksPerHour = parsePositiveInt(args.reviewTasksPerHour, DEFAULT_REVIEW_TASKS_PER_HOUR);
  const autoCommit = boolValue(args.autoCommit, false);
  const reviewOnly = boolValue(args.reviewOnly, false);
  const reviewShardCount = parsePositiveInt(args.reviewParallelism, DEFAULT_REVIEW_PARALLELISM);
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
  const workPoolPath = path.join(repoRoot, "docs", REVIEW_WORK_POOL_FILE);
  const cycleLimitMs = cycleMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const startedAt = new Date();
  const endAt = Date.now() + durationMs;
  const reportState: HourlyWindow = { windowStartMs: startedAt.getTime(), cycles: [] };
  let nextHourlyReportAt = startedAt.getTime() + reportIntervalMinutes * 60_000;
  let reportCycleFrom = 1;
  await ensureWorkPoolFile(workPoolPath);
  const workPoolStartNo = await getLastTaskNoFromWorkPool(workPoolPath) + 1;
  let reviewCycleQuota = 0;
  let reviewTaskCursor = workPoolStartNo;

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
  let activeIngest: ChildProcess | null = null;
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
    }) as ChildProcess;
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
      const safeReviewShards = Math.max(1, Math.min(reviewShardCount, Math.floor(REVIEW_TOPICS.length / REVIEW_ITEMS_PER_SHARD)));
      const cycleQuota = reviewCycleQuota + reviewTasksPerHour * cycleMinutes;
      const tasksForCycle = Math.max(1, Math.floor(cycleQuota / 60));
      reviewCycleQuota = cycleQuota % 60;
      const baseTasksPerShard = Math.floor(tasksForCycle / safeReviewShards);
      const extraTasksPerShard = tasksForCycle % safeReviewShards;
      let cursorForCycle = reviewTaskCursor;

      for (let shard = 0; shard < safeReviewShards; shard += 1) {
        const tasksForShard = baseTasksPerShard + (shard < extraTasksPerShard ? 1 : 0);
        if (tasksForShard <= 0) {
          continue;
        }
        const taskStartNo = cursorForCycle;
        cursorForCycle += tasksForShard;
        runCycleTasks.push(
          (async () => {
            const taskStart = Date.now();
            const section = await appendReviewWorklist({
              cwd: repoRoot,
              cycle,
              cycleMinutes,
              runAt: cycleStart,
              logPath,
              shardIndex: shard,
              shardCount: safeReviewShards,
              tasksForShard,
              taskStartNo,
              tasksPerHour: reviewTasksPerHour,
              workPoolStartNo,
            });
            taskResults.push({
              cycle,
              startedAt: cycleStart.toISOString(),
              endedAt: new Date().toISOString(),
              command: `review-worklist[${shard + 1}/${safeReviewShards}]`,
              exitCode: 0,
              durationMs: Date.now() - taskStart,
              output: section,
            });
          })(),
        );
      }
      reviewTaskCursor = cursorForCycle;
    }

    await Promise.all(runCycleTasks);
    summary.tasks.push(...taskResults);
    for (const task of taskResults) {
      reportState.cycles.push({
        cycle: task.cycle,
        startedAt: task.startedAt,
        endedAt: task.endedAt,
        command: task.command,
        exitCode: task.exitCode,
        output: task.output,
      });
    }

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
    const reportCycleTo = cycle;
    if (Date.now() >= nextHourlyReportAt) {
      let reportRangeFrom = reportCycleFrom;
      while (nextHourlyReportAt <= Date.now()) {
        await appendHourlyReport({
          repoRoot,
          logPath,
          cycleMinutes,
          window: reportState,
          cycleRangeFrom: reportRangeFrom,
          cycleRangeTo: reportCycleTo,
          reportIntervalMinutes,
          reviewTasksPerHour,
        });
        reportRangeFrom = reportCycleTo + 1;
        reportCycleFrom = reportRangeFrom;
        reportState.cycles = [];
        reportState.windowStartMs = nextHourlyReportAt;
        nextHourlyReportAt += reportIntervalMinutes * 60_000;
      }
    }

    const elapsed = Date.now() - cycleStart.getTime();
    const remain = endAt - Date.now();
    const nextDelay = Math.min(cycleLimitMs - elapsed, remain, cycleLimitMs);
    if (nextDelay > 0 && !stopRequested && Date.now() + 1000 < endAt) {
      await sleep(Math.max(5_000, nextDelay));
    }
  }

  ingestStopRequested = true;
  const ingestProcess = activeIngest as ChildProcess | null;
  if (ingestProcess && !ingestProcess.killed) {
    ingestProcess.kill("SIGINT");
    await sleep(500);
    if (!ingestProcess.killed) {
      ingestProcess.kill("SIGKILL");
    }
  }

  if (reportState.cycles.length > 0 || Date.now() >= reportState.windowStartMs + 1) {
    await appendHourlyReport({
      repoRoot,
      logPath,
      cycleMinutes,
      window: reportState,
      cycleRangeFrom: reportCycleFrom,
      cycleRangeTo: summary.completedCycles,
      reportIntervalMinutes,
      reviewTasksPerHour,
    });
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




