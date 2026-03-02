"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Flame,
  Home,
  LayoutList,
  LayoutDashboard,
  ListFilter,
  Map as MapIcon,
  Menu,
  Package,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import NavStats from "./NavStats";
import NavFavoritesBadge from "./NavFavoritesBadge";
import ThemeToggle from "./ThemeToggle";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof Home;
  kind: "home" | "type" | "map" | "path";
  campaignType?: string;
};

const MAIN_MENU: MenuItem[] = [
  { href: "/", label: "홈", icon: Home, kind: "home" },
  { href: "/?campaign_type=VST", label: "상품형", icon: ListFilter, kind: "type", campaignType: "VST" },
  { href: "/map", label: "지도", icon: MapIcon, kind: "map", campaignType: "VST" },
  { href: "/?campaign_type=SHP", label: "체험형", icon: Package, kind: "type", campaignType: "SHP" },
  { href: "/?campaign_type=PRS", label: "서비스형", icon: UserCheck, kind: "type", campaignType: "PRS" },
  { href: "/business", label: "비즈니스", icon: Flame, kind: "path" },
  { href: "/trending", label: "트렌딩", icon: CalendarDays, kind: "path" },
];

const TOOL_MENU: MenuItem[] = [
  { href: "/me", label: "내 활동", icon: LayoutDashboard, kind: "path" },
  { href: "/me/calendar", label: "캘린더", icon: CalendarDays, kind: "path" },
  { href: "/admin", label: "관리 콘솔", icon: ShieldCheck, kind: "path" },
  { href: "/system", label: "시스템", icon: ShieldCheck, kind: "path" },
];

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("campaign_type") || "";
  const currentView = searchParams.get("view") || "list";

  const isActive = (item: MenuItem) => {
    if (item.kind === "home") {
      return pathname === "/" && currentView !== "map" && !currentType;
    }

    if (item.kind === "type") {
      return pathname === "/" && currentView !== "map" && !!item.campaignType && currentType === item.campaignType;
    }

    if (item.kind === "map") {
      return pathname === "/map" || (pathname === "/" && currentView === "map");
    }

    return pathname.startsWith(item.href);
  };

  const menuClass = (active: boolean) =>
    `group flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
      active
        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-[100] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100/80 dark:border-slate-800/80 transition-all duration-500 shadow-sm hover:shadow-md">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0 flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-xl shadow-slate-900/10 dark:shadow-blue-900/20 group-hover:shadow-blue-500/20 transition-all duration-500"
            >
              <LayoutList className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tighter text-slate-900 dark:text-white leading-none">ReviewEverything</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">V2.0 PRO</span>
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} className={menuClass(active)}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-black">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="hidden xl:flex items-center gap-2 bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            {TOOL_MENU.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
                    isActive(item)
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 xl:hidden">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </span>
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <NavFavoritesBadge />
            <Suspense fallback={<div className="w-20 h-8 bg-slate-100 rounded-xl" />}>
              <NavStats />
            </Suspense>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Link href="/me" className="hidden md:flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                <span className="text-[11px] font-black uppercase tracking-widest">내 대시보드</span>
              </Link>
              <Link href="/admin" className="ml-1 flex items-center justify-center w-9 h-9 md:w-auto md:px-4 md:py-2 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-900/20 active:scale-95">
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">관리자 전용</span>
                <Menu className="w-4 h-4 md:hidden" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
