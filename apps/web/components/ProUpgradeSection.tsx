"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Crown, Coffee, Zap, CheckCircle2 } from "lucide-react";

const PRO_FEATURES = [
    { icon: "⚡", title: "수익/시급 자동 계산", desc: "물품 재판매 및 시급 ROI를 알아서 분석" },
    { icon: "📅", title: "캘린더/알람 자동화", desc: "방문 일정, D-day 알림 등 귀찮은 관리 끝" },
    { icon: "🎯", title: "전국 최적 매칭", desc: "시급 효율이 가장 높은 캠페인 우선 추천" },
    { icon: "🤖", title: "AI 원클릭 지원", desc: "가장 귀찮은 신청서 작성을 AI가 대신 97% 완성" },
];

export default function ProUpgradeSection() {
    const [showModal, setShowModal] = useState<"pro" | "coffee" | null>(null);
    const [upgrading, setUpgrading] = useState(false);

    const handleProUpgrade = async () => {
        setUpgrading(true);
        await new Promise(r => setTimeout(r, 800));
        // 실 결제 링크 연동
        window.open("https://toss.me/piwpiw", "_blank");
        setUpgrading(false);
        setShowModal(null);
    };

    const handleCoffee = () => {
        window.open("https://toss.me/piwpiw", "_blank");
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* PRO Card */}
                <div
                    onClick={() => setShowModal("pro")}
                    className="cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group hover:shadow-blue-500/50 transition-all hover:-translate-y-1 active:scale-[0.99]"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Crown className="w-5 h-5 text-amber-300 fill-current" />
                            <span className="text-[11px] font-black uppercase tracking-widest opacity-80">프리미엄 플랜</span>
                        </div>
                        <h3 className="text-2xl font-black mb-1">PRO Membership</h3>
                        <p className="text-[13px] font-bold opacity-75 mb-5">투입 시간, 시급 계산, 재판매 내역 등<br />모든 자잘하고 귀찮은 관리를 AI가 자동화합니다.</p>
                        <div className="flex items-end gap-1 mb-5">
                            <span className="text-3xl font-black">₩19,900</span>
                            <span className="text-sm opacity-60 mb-1">/월</span>
                        </div>
                        <button className="px-6 py-2.5 bg-white text-blue-600 rounded-2xl text-[11px] font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
                            지금 업그레이드하기
                        </button>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full" />
                    <div className="absolute -right-16 -top-8 w-48 h-48 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
                </div>

                {/* Coffee Card */}
                <div
                    onClick={() => setShowModal("coffee")}
                    className="cursor-pointer p-6 rounded-3xl border-2 border-dashed border-amber-300/50 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 flex flex-col items-center justify-center gap-3 group hover:border-amber-400 dark:hover:border-amber-700 transition-all hover:-translate-y-1 active:scale-[0.99] relative"
                >
                    <div className="absolute top-4 right-4 flex -space-x-1.5 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[7px] font-bold">
                                {i === 3 ? "+42" : ""}
                            </div>
                        ))}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <Coffee className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">개발팀 응원하기</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            오늘만 <span className="text-amber-600 dark:text-amber-400 font-black">42명</span>이 커피를 쐈어요!<br />
                            무료 배포 유지를 위해 응원해주세요 ☕
                        </p>
                    </div>
                    <button className="mt-1 px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2">
                        <Coffee className="w-3 h-3" />
                        Toss / Kakao Pay Support
                    </button>
                </div>
            </div>

            {/* PRO Modal */}
            <AnimatePresence>
                {showModal === "pro" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-md"
                        >
                            <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-xl">
                                    <Crown className="w-6 h-6 text-amber-300 fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">PRO 멤버십</h3>
                                    <p className="text-[11px] font-bold text-slate-400">월 ₩19,900 · 언제든 해지 가능</p>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {PRO_FEATURES.map(f => (
                                    <li key={f.title} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <span className="text-lg">{f.icon}</span>
                                        <div>
                                            <p className="text-[12px] font-black text-slate-900 dark:text-white">{f.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{f.desc}</p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 ml-auto mt-0.5" />
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleProUpgrade}
                                disabled={upgrading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {upgrading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {upgrading ? "처리 중..." : "결제 수단 연동"}
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {showModal === "coffee" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-sm text-center"
                        >
                            <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl shadow-amber-500/10">
                                ☕
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">응원 감사합니다!</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                후원해주신 금액 덕분에<br />이 서비스를 무상으로 제공할 수 있습니다.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCoffee}
                                    className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                                >
                                    ☕ 3,000원 후원
                                </button>
                                <button
                                    onClick={handleCoffee}
                                    className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                                >
                                    🍕 10,000원 후원
                                </button>
                            </div>
                            <button
                                onClick={handleCoffee}
                                className="mt-3 w-full py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-400 hover:border-amber-300 transition-colors"
                            >
                                카카오페이로 후원하기
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
