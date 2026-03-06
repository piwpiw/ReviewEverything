import fs from "node:fs/promises";
import path from "node:path";

type CheckResult = {
  id: string;
  title: string;
  ok: boolean;
  recommendation: string;
};

type PageAudit = {
  route: string;
  filePath: string;
  score: number;
  checks: CheckResult[];
};

const APP_DIR = path.resolve(process.cwd(), "app");
const REPORT_PATH = path.resolve(process.cwd(), "reports", "page-improvements.md");

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectPageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectPageFiles(absolute);
      if (entry.isFile() && entry.name === "page.tsx") return [absolute];
      return [];
    }),
  );
  return nested.flat();
}

function toRoute(filePath: string) {
  const relativeDir = path.relative(APP_DIR, path.dirname(filePath)).replace(/\\/g, "/");
  if (!relativeDir || relativeDir === ".") return "/";
  return `/${relativeDir}`;
}

function hasPattern(source: string, pattern: RegExp) {
  return pattern.test(source);
}

function getAncestorDirs(filePath: string) {
  const dirs: string[] = [];
  let current = path.dirname(filePath);
  while (current.startsWith(APP_DIR)) {
    dirs.push(current);
    if (current === APP_DIR) break;
    current = path.dirname(current);
  }
  return dirs;
}

async function findBoundary(filePath: string, filename: "loading.tsx" | "error.tsx") {
  const dirs = getAncestorDirs(filePath);
  for (const dir of dirs) {
    if (await exists(path.join(dir, filename))) return true;
  }
  return false;
}

async function findMetadata(filePath: string, source: string) {
  if (hasPattern(source, /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/)) {
    return true;
  }
  const dirs = getAncestorDirs(filePath);
  for (const dir of dirs) {
    const layoutPath = path.join(dir, "layout.tsx");
    if (!(await exists(layoutPath))) continue;
    const layoutSource = await fs.readFile(layoutPath, "utf8");
    if (hasPattern(layoutSource, /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/)) {
      return true;
    }
  }
  return false;
}

function createChecks(
  source: string,
  ctx: { hasMetadata: boolean; hasLoading: boolean; hasError: boolean },
): CheckResult[] {
  const hasH1 = hasPattern(source, /<h1[\s>]/i);
  const hasH2 = hasPattern(source, /<h2[\s>]/i);
  const hasMain = hasPattern(source, /<main[\s>]/i);
  const hasSection = hasPattern(source, /<section[\s>]/i);
  const hasEmpty = hasPattern(source, /(없습니다|없음|empty|no data|비어|폴백|fallback)/i);
  const hasRetry = hasPattern(source, /(재시도|다시|새로고침|retry|refresh)/i);
  const hasDarkMode = hasPattern(source, /dark:/);
  const hasResponsive = hasPattern(source, /\b(sm|md|lg|xl|2xl):/);
  const hasAria = hasPattern(source, /aria-(label|live|describedby|hidden)=/);
  const hasSkeleton = hasPattern(source, /(skeleton|animate-pulse|loading)/i);
  const hasSearchParams = hasPattern(source, /(searchParams|useSearchParams)/);
  const hasParamValidation = hasPattern(source, /(Number\.parseInt|parseInt\(|toNumber|Boolean\(|typeof)/);
  const hasLinks = hasPattern(source, /(<Link\s|href=)/);
  const hasFallbackData = hasPattern(source, /(MOCK|mock|fallback|폴백)/);
  const hasStatusFeedback = hasPattern(source, /(error|status|loading|message|success|failed|warn)/i);
  const hasFocusStyle = hasPattern(source, /(focus:|focus-visible:)/);
  const hasAnimation = hasPattern(source, /(motion\.|AnimatePresence|transition-)/);
  const hasSemanticList = hasPattern(source, /<(ul|ol|li)[\s>]/i);
  const hasAsyncData = hasPattern(source, /(await fetch|db\.)/);
  const hasActionButtons = hasPattern(source, /<button[\s>]/i);
  const isThinRoutingPage =
    source.length < 1400 &&
    (hasPattern(source, /redirect\(/) || hasPattern(source, /return\s*<\w+[\s\S]*\/>/)) &&
    !hasMain &&
    !hasH1;

  const uiCheck = (value: boolean) => (isThinRoutingPage ? true : value);

  return [
    {
      id: "metadata",
      title: "Metadata 정의",
      ok: ctx.hasMetadata,
      recommendation: "페이지 또는 레이아웃에 `metadata/generateMetadata`를 추가하세요.",
    },
    {
      id: "main",
      title: "메인 랜드마크",
      ok: uiCheck(hasMain),
      recommendation: "화면 루트를 `<main>`으로 감싸 스크린리더 탐색을 명확히 하세요.",
    },
    {
      id: "heading_h1",
      title: "주요 제목(H1)",
      ok: uiCheck(hasH1),
      recommendation: "페이지 목적을 설명하는 `<h1>`을 추가하세요.",
    },
    {
      id: "heading_h2",
      title: "보조 제목(H2)",
      ok: uiCheck(hasH2),
      recommendation: "섹션별 `<h2>`를 추가해 구조를 분리하세요.",
    },
    {
      id: "section",
      title: "섹션 분리",
      ok: uiCheck(hasSection),
      recommendation: "핵심 블록을 `<section>`으로 나눠 정보 구조를 명확히 하세요.",
    },
    {
      id: "loading_boundary",
      title: "로딩 경계",
      ok: ctx.hasLoading,
      recommendation: "`loading.tsx`를 추가해 비동기 상태에서도 레이아웃 안정성을 유지하세요.",
    },
    {
      id: "error_boundary",
      title: "오류 경계",
      ok: ctx.hasError,
      recommendation: "`error.tsx`를 추가해 실패 시 복구 버튼을 제공하세요.",
    },
    {
      id: "empty_state",
      title: "빈 상태 메시지",
      ok: uiCheck(hasEmpty),
      recommendation: "데이터가 없을 때 사용자 행동을 안내하는 빈 상태를 추가하세요.",
    },
    {
      id: "retry_action",
      title: "재시도 액션",
      ok: uiCheck(hasRetry),
      recommendation: "실패/빈 상태에서 재조회 또는 우회 경로 버튼을 제공하세요.",
    },
    {
      id: "dark_mode",
      title: "다크 모드 대응",
      ok: uiCheck(hasDarkMode),
      recommendation: "`dark:` 클래스로 주요 텍스트/배경 대비를 확보하세요.",
    },
    {
      id: "responsive",
      title: "반응형 포인트",
      ok: uiCheck(hasResponsive),
      recommendation: "모바일/데스크톱 분기를 위해 `sm/md/lg` 브레이크포인트를 적용하세요.",
    },
    {
      id: "aria",
      title: "ARIA 속성",
      ok: uiCheck(hasAria),
      recommendation: "아이콘 버튼 등 의미가 불명확한 요소에 `aria-label`을 추가하세요.",
    },
    {
      id: "skeleton",
      title: "스켈레톤/로딩 UI",
      ok: uiCheck(hasSkeleton),
      recommendation: "네트워크 대기 상태를 시각화하는 스켈레톤을 추가하세요.",
    },
    {
      id: "params",
      title: "파라미터 검증",
      ok: !hasSearchParams || hasParamValidation,
      recommendation: "query/path 파라미터를 숫자/허용값 기준으로 검증하세요.",
    },
    {
      id: "navigation",
      title: "이동 경로",
      ok: uiCheck(hasLinks),
      recommendation: "복구 경로를 위해 상위 페이지 이동 링크를 제공하세요.",
    },
    {
      id: "fallback_data",
      title: "폴백 데이터",
      ok: uiCheck(hasFallbackData),
      recommendation: "API 실패 시 최소한의 폴백 데이터 또는 메시지를 제공하세요.",
    },
    {
      id: "status_feedback",
      title: "상태 피드백",
      ok: uiCheck(hasStatusFeedback),
      recommendation: "요청 상태(loading/error/success)를 사용자에게 명확히 노출하세요.",
    },
    {
      id: "focus_style",
      title: "키보드 포커스",
      ok: uiCheck(hasFocusStyle),
      recommendation: "포커스 가능한 요소에 `focus-visible` 스타일을 추가하세요.",
    },
    {
      id: "animation",
      title: "전환/애니메이션",
      ok: uiCheck(hasAnimation),
      recommendation: "의미 있는 전환 효과로 상태 변화 인지를 강화하세요.",
    },
    {
      id: "semantic_list_or_actions",
      title: "목록/액션 구조",
      ok: uiCheck(hasSemanticList || hasActionButtons || !hasAsyncData),
      recommendation: "데이터 표시 시 `<ul>/<li>` 또는 명확한 액션 버튼 구조를 사용하세요.",
    },
  ];
}

async function auditPage(filePath: string): Promise<PageAudit> {
  const source = await fs.readFile(filePath, "utf8");
  const [hasMetadata, hasLoading, hasError] = await Promise.all([
    findMetadata(filePath, source),
    findBoundary(filePath, "loading.tsx"),
    findBoundary(filePath, "error.tsx"),
  ]);

  const checks = createChecks(source, { hasMetadata, hasLoading, hasError });
  const passed = checks.filter((check) => check.ok).length;

  return {
    route: toRoute(filePath),
    filePath,
    score: passed,
    checks,
  };
}

function renderReport(audits: PageAudit[]) {
  const lines: string[] = [];
  const sorted = audits.sort((a, b) => a.score - b.score);
  const totalPages = sorted.length;
  const totalChecks = totalPages * 20;
  const passedChecks = sorted.reduce((acc, page) => acc + page.score, 0);

  lines.push("# 페이지 개선안 병렬 점검 리포트");
  lines.push("");
  lines.push(`- 생성 시각: ${new Date().toISOString()}`);
  lines.push(`- 점검 페이지 수: ${totalPages}`);
  lines.push(`- 항목 수: 페이지당 20개`);
  lines.push(`- 전체 통과율: ${passedChecks}/${totalChecks} (${Math.round((passedChecks / totalChecks) * 100)}%)`);
  lines.push("");

  for (const page of sorted) {
    lines.push(`## ${page.route} (${page.score}/20)`);
    lines.push(`- 파일: \`${path.relative(process.cwd(), page.filePath).replace(/\\/g, "/")}\``);
    lines.push("");
    for (const check of page.checks) {
      const status = check.ok ? "OK" : "TODO";
      lines.push(`- [${status}] ${check.title}: ${check.ok ? "충족" : check.recommendation}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const pages = await collectPageFiles(APP_DIR);
  const audits = await Promise.all(pages.map((filePath) => auditPage(filePath)));
  const report = renderReport(audits);

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, report, "utf8");

  const lowest = [...audits].sort((a, b) => a.score - b.score).slice(0, 5);
  console.log(`[page-improvements] audited ${audits.length} pages -> reports/page-improvements.md`);
  for (const page of lowest) {
    console.log(`- ${page.route}: ${page.score}/20`);
  }
}

main().catch((error) => {
  console.error("[page-improvements] failed", error);
  process.exit(1);
});
