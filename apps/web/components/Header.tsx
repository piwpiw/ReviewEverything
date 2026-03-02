"use client";

import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Map as MapIcon, Package, UserCheck, LayoutList, Menu } from "lucide-react";
import NavStats from "./NavStats";
import NavFavoritesBadge from "./NavFavoritesBadge";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
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
                            <span className="font-black text-base tracking-tighter text-slate-900 dark:text-white leading-none">리뷰 캠페인 허브</span>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">V2.0 PRO</span>
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                        <Link href="/me?userId=1" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-sm">
                            <CalendarDays className="w-3.5 h-3.5 text-violet-500" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">내 캘린더</span>
                        </Link>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <Link href="/?campaign_type=VST" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-sm">
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">방문체험</span>
                        </Link>
                        <Link href="/?campaign_type=VST&view=map" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-sm">
                            <MapIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">지도탐색</span>
                        </Link>
                        <Link href="/?campaign_type=SHP" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-sm">
                            <Package className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">구매형</span>
                        </Link>
                        <Link href="/?campaign_type=PRS" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-sm">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">기자단</span>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3 md:gap-6 shrink-0">
                    <div className="flex items-center gap-1 md:gap-3 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                        <NavFavoritesBadge />
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                        <Suspense fallback={<div className="w-20 h-8 skeleton rounded-xl" />}>
                            <NavStats />
                        </Suspense>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <Link href="/system" className="hidden md:flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all group">
                                <span className="text-[10px] font-black uppercase tracking-widest">System</span>
                            </Link>
                            <Link href="/me?userId=1" className="flex items-center gap-2.5 pl-2.5 pr-5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-sm">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-blue-500/20">P</div>
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">My Platform</span>
                            </Link>
                            <Link href="/admin" className="ml-1 flex items-center justify-center w-9 h-9 md:w-auto md:px-5 md:py-2.5 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-900/20 active:scale-95">
                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Admin Console</span>
                                <Menu className="w-4 h-4 md:hidden" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
