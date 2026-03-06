"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Layers,
  BarChart2,
  ArrowUpRight,
  Target,
} from "lucide-react";

type PlatformStat = {
  date: string;
  totalCampaigns: number;
  totalRecruits: number;
  totalApplicants: number;
  avgCompRate: number;
};

type GroupedStats = Record<string, PlatformStat[]>;

export default function AnalyticsDashboard() {
  const [data, setData] = useState<GroupedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"campaigns" | "competition">("campaigns");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/analytics/stats");
        const json = await res.json();
        setData(json.data);
      } catch (e) {
        console.error("통계 조회 실패", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/60">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">데이터를 불러오는 중입니다.</span>
      </div>
    );
  }

  if (!data) return null;

  const platforms = Object.keys(data);

  const summary = platforms.map((name) => {
    const history = data[name];
    const latest = history[0];
    const previous = history[1] || latest;

    return {
      name,
      latest,
      change: latest.totalCampaigns - previous.totalCampaigns,
      compRate: latest.avgCompRate,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/80 relative overflow-hidden group hover:border-blue-500/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">플랫폼</span>
                <h4 className="text-xl font-black text-white">{item.name}</h4>
              </div>
              <div
                className={`p-2.5 rounded-2xl ${
                  item.change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}
              >
                {item.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="rotate-180 w-5 h-5" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-black text-slate-600 block mb-1">총 캠페인</span>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white leading-none">{item.latest.totalCampaigns}</span>
                  {item.change !== 0 && (
                    <span className={`text-[10px] font-black mb-0.5 ${item.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {item.change > 0 ? "+" : ""}
                      {item.change}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-600 block mb-1">평균 경쟁률</span>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white leading-none">{item.latest.avgCompRate.toFixed(1)}</span>
                  <span className="text-[9px] font-black text-slate-500 mb-0.5">: 1</span>
                </div>
              </div>
            </div>

            <div className="mt-6 h-10 flex items-end gap-1 px-1">
              {data[item.name].slice(0, 7).reverse().map((h, j) => (
                <div
                  key={j}
                  className="flex-1 bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-all"
                  style={{ height: `${Math.max(20, (h.totalCampaigns / 500) * 100)}%` }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/80 p-10 overflow-hidden relative shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              운영 분석 지표
            </h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              플랫폼별 성능과 경쟁률을 한 번에 비교하세요.
            </p>
          </div>

          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-slate-800 self-end">
            <button
              onClick={() => setView("campaigns")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${
                view === "campaigns" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              캠페인
            </button>
            <button
              onClick={() => setView("competition")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${
                view === "competition" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              경쟁률
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {summary
            .sort((a, b) => b.latest.totalCampaigns - a.latest.totalCampaigns)
            .map((item, idx) => {
              const maxVal = Math.max(...summary.map((s) => (view === "campaigns" ? s.latest.totalCampaigns : s.compRate)));
              const percentage = view === "campaigns" ? (item.latest.totalCampaigns / maxVal) * 100 : (item.compRate / maxVal) * 100;

              return (
                <div key={item.name} className="flex flex-col gap-2 group">
                  <div className="flex justify-between text-[11px] font-black uppercase px-2">
                    <span className="text-slate-400 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span className="text-[9px] text-slate-700">{`0${idx + 1}`}</span>
                      {item.name}
                    </span>
                    <span className="text-white">
                      {view === "campaigns" ? `${item.latest.totalCampaigns}개` : `${item.compRate.toFixed(2)}:1`}
                    </span>
                  </div>
                  <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut", delay: idx * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        view === "campaigns"
                          ? "from-blue-600/50 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                          : "from-indigo-600/50 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 pt-16 border-t border-slate-800/60">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">전체 플랫폼</span>
            </div>
            <div className="text-2xl font-black text-white">{summary.reduce((a, b) => a + b.latest.totalCampaigns, 0).toLocaleString()}</div>
            <span className="text-[9px] font-black text-slate-600">총 캠페인</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">총 모집인원</span>
            </div>
            <div className="text-2xl font-black text-white">{summary.reduce((a, b) => a + b.latest.totalRecruits, 0).toLocaleString()}</div>
            <span className="text-[9px] font-black text-slate-600">총 모집수</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">고경쟁</span>
            </div>
            <div className="text-2xl font-black text-white">{summary.filter((s) => s.compRate > 5).length}</div>
            <span className="text-[9px] font-black text-slate-600">5:1 이상</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">일별 변화</span>
            </div>
            <div className="text-2xl font-black text-white">+{summary.reduce((a, b) => a + b.change, 0)}</div>
            <span className="text-[9px] font-black text-slate-600">전체 증감</span>
          </div>
        </div>
      </div>
    </div>
  );
}
