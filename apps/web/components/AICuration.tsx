"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap, Clock, ChevronRight, Calculator, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

// Mock AI Logic for the curation
const AI_PICKS = [
    {
        id: 1,
        title: "[AI 강력 추천] 청담 프리미엄 스키야키 2인 식사권",
        category: "식음료",
        roi: "15.4x",
        efficiency: "₩65,000/h",
        deadline: "D-2",
        match_score: 98,
        reason: "유저님의 선호 카테고리(식음료)이며, 시간 대비 수익률이 상위 1%입니다.",
        img: "https://images.unsplash.com/photo-1544025162-831518f8887b?w=400"
    },
    {
        id: 2,
        title: "[고효율] 비건 스킨케어 5종 세트 + 원고료 5만",
        category: "뷰티",
        roi: "8.2x",
        efficiency: "₩42,000/h",
        deadline: "D-4",
        match_score: 85,
        reason: "재판매 가치가 높은 물품이며, 리뷰 작성 시간이 짧은 배송형입니다.",
        img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"
    }
];

export default function AICuration() {
    return (
        <div className="space-y-8 mt-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Smart Curation</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personalized Campaign Intelligence</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">AI Logic Verified (v2.4)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {AI_PICKS.map((pick, i) => (
                    <motion.div
                        key={pick.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all overflow-hidden"
                    >
                        {/* Match Score Badge */}
                        <div className="absolute top-6 right-6 z-10">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-110 transition-transform">
                                <span className="text-[10px] font-black text-blue-100 leading-none">MATCH</span>
                                <span className="text-base font-black text-white leading-none">{pick.match_score}%</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative w-full md:w-40 h-40 rounded-3xl overflow-hidden shrink-0 shadow-lg">
                                <img src={pick.img} alt="" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <div className="absolute bottom-3 left-3 flex gap-1.5">
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white">{pick.category}</span>
                                    <span className="px-2 py-1 bg-rose-500 rounded-lg text-[9px] font-black text-white">{pick.deadline}</span>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-tight mb-3">
                                        {pick.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">ROI Value</p>
                                                <p className="text-sm font-black text-emerald-600">{pick.roi}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Time Efficiency</p>
                                                <p className="text-sm font-black text-blue-600">{pick.efficiency}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
                                        💡 {pick.reason}
                                    </p>
                                </div>

                                <Link
                                    href={`/campaigns/${pick.id}`}
                                    className="mt-6 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black text-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    지금 신청하고 수익 확정하기 <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Smart Summary Insight */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Zap className="w-40 h-40" />
                </div>
                <h3 className="text-2xl font-black mb-2 relative z-10 flex items-center gap-3">
                    <Star className="w-6 h-6 text-amber-400 fill-current" />
                    이번 주 AI 정산 리포트 <span className="text-sm font-bold opacity-50 px-3 border-l ml-3">Week 10 Analysis</span>
                </h3>
                <p className="text-slate-300 font-bold mb-8 max-w-xl relative z-10 leading-relaxed">
                    유저님의 활동 패턴을 분석한 결과, 다음 주는 <span className="text-white font-black underline decoration-blue-500">배송형 체험단(SHP)</span> 비율을 20% 높이는 것이 시간당 이득(ROI) 극대화에 유리할 것으로 보입니다.
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {[
                        { label: "Optimal Category", value: "Beauty & Tech", icon: Zap },
                        { label: "Recommended Ratio", value: "Visit 4 : Ship 6", icon: Clock },
                        { label: "Est. Weekly Gain", value: "₩542,000", icon: TrendingUp },
                        { label: "AI Efficiency Index", value: "A++", icon: ShieldCheck },
                    ].map((item, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
                            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">{item.label}</p>
                            <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 text-blue-400" />
                                <span className="text-base font-black">{item.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
