"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Clock, Target, ChevronRight, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TRENDING_MOCK = [
  { id: 1, title: "[리뷰단] 2차 추첨 이벤트, 포인트 1200원 보상", recruit: 2, applicants: 1540, reward: "1,200원, 최대 보상", img: "https://images.unsplash.com/photo-1542314831-c6a4203251f8?w=500" },
  { id: 2, title: "[체험단] 신제품 체험 리워드 1건 (D-1 마감)", recruit: 5, applicants: 2310, reward: "상금 709,000원", img: "https://images.unsplash.com/photo-1634546416952-4752b07e868f?w=500" },
  { id: 3, title: "[미식] 2개월 연속 참여자 대기, 즉시 지급", recruit: 3, applicants: 855, reward: "적립금 350,000원(2개월)", img: "https://images.unsplash.com/photo-1590454647900-a61f5b0ad5fb?w=500" },
];

const HONEYPOT_MOCK = [
  { id: 10, title: "[마감 임박] 30건 한정 모집 마감 임박", recruit: 30, applicants: 8, reward: "상금 200,000원", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400" },
  { id: 11, title: "[체험단] 신규 리뷰어 특별 보너스", recruit: 5, applicants: 2, reward: "보너스 60,000원", img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400" },
  { id: 12, title: "[SNS] 콘텐츠 공유 모집 4건 모집중", recruit: 20, applicants: 5, reward: "캐시 100,000원", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" },
];

export default function TrendingPage() {
  const [realTrending, setRealTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const containerFade: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const slideUp: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.8 } },
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setRealTrending(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayedTrending =
    realTrending.length > 0
      ? realTrending.map((c) => ({
        id: c.id,
        title: c.title,
        recruit: c.snapshots?.[0]?.recruit_count || 10,
        applicants: c.snapshots?.[0]?.applicant_count || 0,
        reward: c.reward_value || "보상은 개별 안내 예정",
        img: c.image_url || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500",
      }))
      : TRENDING_MOCK;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-orange-500/30">
      <div className="pt-12 px-6 pb-6 bg-gradient-to-b from-orange-900/20 to-black sticky top-0 z-40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 font-sans flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-orange-500" strokeWidth={2.5} />
              실시간 트렌드
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">최근 오픈된 인기 캠페인과 마감 임박 리스트를 한눈에 확인하세요.</p>
          </div>
        </div>
      </div>

      <motion.div variants={containerFade} initial="hidden" animate="show" className="space-y-12 mt-6 overflow-hidden">
        <motion.section variants={slideUp} className="pl-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold tracking-tight">실시간 TOP 10</h2>
            <ChevronRight className="w-4 h-4 text-slate-500 ml-2" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 pr-6 snap-x hide-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {loading && displayedTrending === TRENDING_MOCK ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-72 h-80 rounded-[2rem] bg-slate-900 animate-pulse border border-white/5" />
              ))
            ) : (
              displayedTrending.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/campaigns/${item.id}`}
                  className="snap-start shrink-0 w-72 relative rounded-[2rem] overflow-hidden group cursor-pointer border border-white/10 hover:border-orange-500/50 transition-colors"
                >
                  <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md text-white font-black text-xs px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10 shadow-lg">
                    <Trophy className="w-3 h-3 text-yellow-400" /> {idx + 1}위
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <img src={item.img} alt={item.title} className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-orange-300">
                        경쟁률 {item.applicants > 0 && item.recruit > 0 ? (item.applicants / item.recruit).toFixed(1) : "0"}:1
                      </span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight text-white line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-300 font-medium">{item.reward}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.section>

        <motion.section variants={slideUp} className="px-6">
          <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold tracking-tight text-white">잠재 마감 임박 리스트</h2>
                </div>
                <p className="text-xs text-indigo-300/80">고경쟁·고유입 캠페인을 빠르게 확인해 보세요.</p>
              </div>
            </div>

            <div className="space-y-3">
              {HONEYPOT_MOCK.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer items-center">
                  <img src={item.img} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.reward}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.applicants / item.recruit) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-indigo-300 font-bold tracking-tighter">{item.applicants}/{item.recruit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section variants={slideUp} className="px-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold tracking-tight text-slate-200">마감 임박</h2>
            <span className="text-xs px-2 py-0.5 ml-2 bg-red-500/20 text-red-400 rounded-full font-bold">즉시확인</span>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">곧 마감되는 캠페인 알림</h3>
                <p className="text-xs text-slate-400">3일 이내 마감되는 공고를 빠르게 확인하세요.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
