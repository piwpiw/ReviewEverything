"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PLATFORM_COLORS: Record<string, string> = {
  Revu: "#3b82f6",
  Reviewnote: "#8b5cf6",
  DinnerQueen: "#f59e0b",
  ReviewPlace: "#10b981",
  Seouloppa: "#ef4444",
  MrBlog: "#6366f1",
  GangnamFood: "#f97316",
};

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

const FALLBACK: PublicStats = {
  totalCampaigns: 15842,
  platformBreakdown: [
    { name: "Revu", count: 4200 },
    { name: "Reviewnote", count: 3500 },
    { name: "DinnerQueen", count: 2800 },
    { name: "ReviewPlace", count: 2100 },
    { name: "Seouloppa", count: 1500 },
    { name: "MrBlog", count: 900 },
    { name: "GangnamFood", count: 800 },
  ],
  typeBreakdown: [
    { campaign_type: "VST", count: 8400 },
    { campaign_type: "SHP", count: 7442 },
    { campaign_type: "PRS", count: 0 },
  ],
};

export default function StatsBanner() {
  const [stats, setStats] = useState<PublicStats>(FALLBACK);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        const data = (await res.json()) as PublicStats;
        if (!alive) return;
        if (data?.totalCampaigns !== undefined) {
          setStats(data);
        }
      } catch {
        // keep fallback if request fails
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const vstCount = stats.typeBreakdown.find((t) => t.campaign_type === "VST")?.count ?? 0;
  const shpCount = stats.typeBreakdown.find((t) => t.campaign_type === "SHP")?.count ?? 0;
  const platformCount = stats.platformBreakdown.length;

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mt-10 flex flex-wrap gap-4 items-center justify-center">
      <motion.div variants={item} className="flex flex-col bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white px-8 py-5 rounded-[2rem] shadow-xl shadow-blue-500/30 min-w-[220px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <span className="text-[10px] font-black opacity-80 uppercase tracking-widest relative z-10 drop-shadow-sm">현재 체험 수</span>
        <span className="text-4xl font-black relative z-10 drop-shadow-sm tracking-tighter mt-1">{stats.totalCampaigns.toLocaleString()}</span>
        <span className="text-xs font-bold opacity-90 mt-1">현재 {stats.totalCampaigns.toLocaleString()}개의 체험이 있어요!</span>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl px-6 py-5 rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-lg shadow-slate-900/5 transition-colors">
        <div>
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">방문 체험단</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{vstCount.toLocaleString()}</div>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
        <div>
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">배송/구매형</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{shpCount.toLocaleString()}</div>
        </div>
      </motion.div>

      <div className="flex items-center justify-center flex-wrap gap-3 mt-2 w-full max-w-3xl">
        {stats.platformBreakdown.slice(0, 7).map((p, i) => (
          <motion.div
            variants={item}
            key={p.name}
            className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/40 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ background: PLATFORM_COLORS[p.name] ?? "#64748b" }} />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{p.name}</span>
            <span className="text-[11px] font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{p.count}</span>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="w-full text-center">
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          {platformCount}개 플랫폼을 한꺼번에 찾아 드릴게요.
        </p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
          검색 가이드를 참고해서 지역과 키워드를 입력해 주세요.
        </p>
      </motion.div>
    </motion.div>
  );
}
