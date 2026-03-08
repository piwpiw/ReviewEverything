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
  Package,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import NavStats from "./NavStats";
import NavFavoritesBadge from "./NavFavoritesBadge";
import ThemeToggle from "./ThemeToggle";
import HeaderAuthActions from "./HeaderAuthActions";
import { useMemo } from "react";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof Home;
  kind: "home" | "type" | "map" | "path";
  campaignType?: string;
};

const MAIN_MENU: MenuItem[] = [
  { href: "/", label: "홈", icon: Home, kind: "home" },
  { href: "/?campaign_type=VST", label: "방문형", icon: ListFilter, kind: "type", campaignType: "VST" },
  { href: "/map", label: "지도", icon: MapIcon, kind: "map", campaignType: "VST" },
  { href: "/?campaign_type=SHP", label: "쇼핑형", icon: Package, kind: "type", campaignType: "SHP" },
  { href: "/?campaign_type=PRS", label: "구매형", icon: UserCheck, kind: "type", campaignType: "PRS" },
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

  const mapHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "map");
    const query = params.toString();
    return query ? `/?${query}` : "/map";
  }, [searchParams]);

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
    `group flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${active
      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
      : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <header className="nav-glass">
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between gap-8">
        <div className="flex items-center gap-12">
          <Link href="/" className="shrink-0 flex items-center gap-4 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-500"
            >
              <LayoutList className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-tight">ReviewEverything</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Premium Hub</span>
              </div>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const href = item.kind === "map" ? mapHref : item.href;
              return (
                <Link key={item.href} href={href} className={menuClass(active)}>
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-8 shrink-0">
          <div className="hidden xl:flex items-center gap-4">
            {TOOL_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold transition-all hover:text-blue-600 ${isActive(item) ? "text-blue-600" : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <NavFavoritesBadge />
            <Suspense fallback={<div className="w-20 h-8 bg-slate-100/50 rounded-xl animate-pulse" />}>
              <NavStats />
            </Suspense>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/50 hidden sm:block" />
            <div className="flex items-center gap-3">
              <HeaderAuthActions />
              <Link href="/admin" className="btn-premium py-2 px-5 text-sm">
                <span>Console</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
