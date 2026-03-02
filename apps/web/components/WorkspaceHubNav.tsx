import Link from "next/link";
import { CalendarDays, ClipboardCheck, Cpu, LayoutDashboard, ShieldCheck, TrendingUp } from "lucide-react";

type WorkspaceKey = "me" | "calendar" | "notifications" | "project" | "admin" | "system";

type WorkspaceLink = {
  key: WorkspaceKey;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  tone: "blue" | "emerald" | "rose" | "violet";
};

const WORKSPACE_LINKS: WorkspaceLink[] = [
  { key: "me", href: "/me", label: "사용자 대시보드", icon: LayoutDashboard, tone: "blue" },
  { key: "calendar", href: "/me/calendar", label: "캘린더", icon: CalendarDays, tone: "emerald" },
  { key: "notifications", href: "/me/notifications", label: "알림", icon: ClipboardCheck, tone: "violet" },
  { key: "project", href: "/me/console", label: "프로젝트 콘솔", icon: Cpu, tone: "rose" },
  { key: "admin", href: "/admin", label: "관리자 콘솔", icon: ShieldCheck, tone: "blue" },
  { key: "system", href: "/system", label: "운영 시스템", icon: TrendingUp, tone: "emerald" },
];

const toneClass = {
  blue: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-500/25 dark:bg-blue-950/50 dark:text-blue-200",
  emerald: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-950/50 dark:text-emerald-200",
  rose: "text-rose-600 border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-950/50 dark:text-rose-200",
  violet: "text-violet-600 border-violet-200 bg-violet-50 dark:border-violet-500/25 dark:bg-violet-950/50 dark:text-violet-200",
};

export default function WorkspaceHubNav({
  current,
  title,
  description,
}: {
  current: WorkspaceKey;
  title: string;
  description: string;
}) {
  return (
    <section className="max-w-[1700px] mx-auto px-4 md:px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">운영 메뉴</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              홈으로
            </Link>
            <Link
              href="/me"
              className="px-4 py-2 rounded-xl text-[11px] font-black border border-slate-200 dark:border-slate-700 bg-slate-900 text-white dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-500 transition-colors"
            >
              사용자 이동
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {WORKSPACE_LINKS.map((link) => {
            const Icon = link.icon;
            const active = current === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black border transition-all ${
                  active
                    ? `${toneClass[link.tone]} border`
                    : "text-slate-500 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
