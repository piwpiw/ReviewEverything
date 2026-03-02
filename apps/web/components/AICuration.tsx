"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Calculator, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

type Pick = {
  id: number;
  title: string;
  category: string;
  roi: string;
  efficiency: string;
  deadline: string;
  match_score: number;
  reason: string;
  thumbnail_url: string | null;
  platform: { id: number; name: string };
};

export default function AICuration() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/me/curation?limit=6");
        const json = (await res.json()) as { picks?: Pick[] };
        if (!canceled) setPicks(Array.isArray(json.picks) ? json.picks : []);
      } catch {
        if (!canceled) setPicks([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, []);

  const hasData = picks.length > 0;

  const summary = useMemo(() => {
    if (!hasData) return null;
    const avgMatch = Math.round(picks.reduce((s, p) => s + p.match_score, 0) / picks.length);
    const urgent = picks.filter((p) => p.deadline.startsWith("D-") && Number(p.deadline.slice(2)) <= 3).length;
    return { avgMatch, urgent };
  }, [hasData, picks]);

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI 추천 큐레이션</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">실시간 개인화 추천</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
            {summary ? `평균 적합도 ${summary.avgMatch}% / 마감 임박 ${summary.urgent}건` : "요약 데이터 수집 중"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm animate-pulse h-[220px]"
            />
          ))}
        </div>
      ) : !hasData ? (
        <div className="rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-sm font-black text-slate-900 dark:text-white">추천 데이터가 없습니다.</p>
          <p className="text-xs font-bold text-slate-400 mt-2">잠시 후 다시 확인해 주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {picks.map((pick, i) => (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all overflow-hidden"
            >
              <div className="absolute top-6 right-6 z-10">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-110 transition-transform">
                  <span className="text-[10px] font-black text-blue-100 leading-none">MATCH</span>
                  <span className="text-base font-black text-white leading-none">{pick.match_score}%</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative w-full md:w-40 h-40 rounded-3xl overflow-hidden shrink-0 shadow-lg bg-slate-100 dark:bg-slate-800">
                  <img
                    src={pick.thumbnail_url || "https://via.placeholder.com/400"}
                    alt={pick.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white">
                      {pick.category}
                    </span>
                    <span className="px-2 py-1 bg-rose-500 rounded-lg text-[9px] font-black text-white">{pick.deadline}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{pick.platform.name}</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-tight mb-3">{pick.title}</h3>

                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">수익률</p>
                          <p className="text-sm font-black text-emerald-600">{pick.roi}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">효율성</p>
                          <p className="text-sm font-black text-blue-600">{pick.efficiency}</p>
                        </div>
                      </div>
                    </div>

                    <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
                      {pick.reason}
                    </p>
                  </div>

                  <Link
                    href={`/campaigns/${pick.id}`}
                    className="mt-6 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black text-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    캠페인 상세보기 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
