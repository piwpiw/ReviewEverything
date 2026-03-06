"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPlatformDisplay } from "@/lib/platformDisplay";

type PlatformStat = {
  name: string;
  count: number;
};

type TypeStat = {
  campaign_type: string | null;
  count: number;
};

type PublicStats = {
  totalCampaigns: number;
  platformBreakdown: PlatformStat[];
  typeBreakdown: TypeStat[];
};

export default function StatsBanner() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        const data = (await res.json()) as PublicStats;
        if (!alive) return;
        if (data?.totalCampaigns !== undefined) {
          setStats(data);
        } else {
          setStats(null);
        }
      } catch {
        if (alive) setStats(null);
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const vstCount = stats?.typeBreakdown.find((t) => t.campaign_type === "VST")?.count ?? 0;
  const shpCount = stats?.typeBreakdown.find((t) => t.campaign_type === "SHP")?.count ?? 0;
  const platformCount = stats?.platformBreakdown.length ?? 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <motion.div variants={item} className="relative min-w-[200px] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-4 text-white shadow-xl shadow-blue-500/30">
        <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <span className="relative z-10 text-[10px] font-black uppercase tracking-widest opacity-80">현재 체험단 수</span>
        <span className="relative z-10 mt-1 block text-3xl font-black tracking-tighter">
          {loaded ? (stats ? stats.totalCampaigns.toLocaleString() : "-") : "..."}
        </span>
        <span className="relative z-10 mt-1 block text-[11px] font-bold opacity-90">
          {stats
            ? `${stats.totalCampaigns.toLocaleString()}개 캠페인 운영 중`
            : loaded
              ? "실시간 집계 대기 중"
              : "집계 로딩 중"}
        </span>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-4 rounded-[1.75rem] border border-white/50 bg-white/60 px-5 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-2xl transition-colors dark:border-slate-800/50 dark:bg-slate-900/40">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">방문 체험단</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{vstCount.toLocaleString()}</div>
        </div>
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">배송/구매형</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{shpCount.toLocaleString()}</div>
        </div>
      </motion.div>

      <div className="mt-1 flex w-full max-w-4xl flex-wrap items-center justify-center gap-2">
        {(stats?.platformBreakdown || []).slice(0, 8).map((platform) => {
          const display = getPlatformDisplay(platform.name);
          return (
            <motion.div
              variants={item}
              key={platform.name}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${display.badgeClassName}`}
            >
              <div className="h-2 w-2 rounded-full shadow-inner" style={{ background: display.dotColor }} />
              <span className="text-[11px] font-bold">{display.shortLabel}</span>
              <span className="rounded-md bg-white/70 px-2 py-0.5 text-[11px] font-black dark:bg-slate-950/40">{platform.count}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={item} className="w-full text-center">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          {platformCount > 0
            ? `${platformCount}개 체험단 플랫폼을 한 화면에서 비교할 수 있습니다.`
            : "플랫폼 집계가 준비되면 여기에 즉시 표시됩니다."}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">검색 가이드를 참고해서 지역과 키워드를 입력해 주세요.</p>
      </motion.div>
    </motion.div>
  );
}
