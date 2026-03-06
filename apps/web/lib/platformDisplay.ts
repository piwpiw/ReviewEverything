type PlatformDisplayMeta = {
  key: string;
  label: string;
  shortLabel: string;
  badgeClassName: string;
  dotColor: string;
};

const PLATFORM_META: Record<string, PlatformDisplayMeta> = {
  revu: {
    key: "revu",
    label: "레뷰",
    shortLabel: "레뷰",
    badgeClassName: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50",
    dotColor: "#2563eb",
  },
  reviewnote: {
    key: "reviewnote",
    label: "리뷰노트",
    shortLabel: "리뷰노트",
    badgeClassName: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700/50",
    dotColor: "#7c3aed",
  },
  dinnerqueen: {
    key: "dinnerqueen",
    label: "디너의여왕",
    shortLabel: "디너의여왕",
    badgeClassName: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/50",
    dotColor: "#d97706",
  },
  reviewplace: {
    key: "reviewplace",
    label: "리뷰플레이스",
    shortLabel: "리뷰플",
    badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/50",
    dotColor: "#059669",
  },
  seouloppa: {
    key: "seouloppa",
    label: "서울오빠",
    shortLabel: "서울오빠",
    badgeClassName: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/50",
    dotColor: "#e11d48",
  },
  mrblog: {
    key: "mrblog",
    label: "미스터블로그",
    shortLabel: "미블",
    badgeClassName: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700/50",
    dotColor: "#4f46e5",
  },
  gangnamfood: {
    key: "gangnamfood",
    label: "강남맛집",
    shortLabel: "강남맛집",
    badgeClassName: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/50",
    dotColor: "#ea580c",
  },
};

const normalizePlatformKey = (value?: string | null) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
};

export function getPlatformDisplay(value?: string | null): PlatformDisplayMeta {
  const key = normalizePlatformKey(value);
  const meta = PLATFORM_META[key];
  if (meta) return meta;

  const fallbackLabel = String(value || "미분류 플랫폼").trim() || "미분류 플랫폼";
  return {
    key: key || "unknown",
    label: fallbackLabel,
    shortLabel: fallbackLabel,
    badgeClassName: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/50",
    dotColor: "#64748b",
  };
}
