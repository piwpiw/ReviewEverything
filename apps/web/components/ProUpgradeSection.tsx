"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Crown, Coffee, Zap, CheckCircle2 } from "lucide-react";

const PRO_FEATURES = [
  {
    icon: "🧠",
    title: "AI 우선 큐레이션",
    desc: "캠페인 선별 정확도와 제안 근거를 강화해 더 빠르게 결정할 수 있습니다.",
  },
  {
    icon: "⏱️",
    title: "D-day 알림 강화",
    desc: "캠페인 마감 직전 단계별 리마인드 알림을 자동으로 받습니다.",
  },
  {
    icon: "📊",
    title: "통합 운영 대시보드",
    desc: "캠페인 성과, 수익 예측, 상태별 진행률을 한 화면에서 확인합니다.",
  },
  {
    icon: "🔔",
    title: "알림 채널 최적화",
    desc: "카카오톡/텔레그램/푸시 경로의 실패 이력까지 한 번에 추적합니다.",
  },
];

export default function ProUpgradeSection() {
  const [showModal, setShowModal] = useState<"pro" | "coffee" | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const handleProUpgrade = async () => {
    setUpgrading(true);
    await new Promise((r) => setTimeout(r, 800));
    window.open("https://toss.me/piwpiw_me", "_blank");
    setUpgrading(false);
    setShowModal(null);
  };

  const handleCoffee = () => {
    window.open("https://toss.me/piwpiw_me", "_blank");
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div
          onClick={() => setShowModal("pro")}
          className="cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group hover:shadow-blue-500/50 transition-all hover:-translate-y-1 active:scale-[0.99]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-300 fill-current" />
              <span className="text-[11px] font-black uppercase tracking-widest opacity-80">프로 권장</span>
            </div>
            <h3 className="text-2xl font-black mb-1">PRO 멤버십</h3>
            <p className="text-[13px] font-bold opacity-75 mb-5">월 9,900원으로 AI 추천 정확도·운영 자동화·알림 품질을 업그레이드합니다.</p>
            <div className="flex items-end gap-1 mb-5">
              <span className="text-3xl font-black">9,900원</span>
              <span className="text-sm opacity-60 mb-1">/월</span>
            </div>
            <button className="px-6 py-2.5 bg-white text-blue-600 rounded-2xl text-[11px] font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
              PRO 이용하기
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -right-16 -top-8 w-48 h-48 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
        </div>

        <div
          onClick={() => setShowModal("coffee")}
          className="cursor-pointer p-6 rounded-3xl border-2 border-dashed border-amber-300/50 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 flex flex-col items-center justify-center gap-3 group hover:border-amber-400 dark:hover:border-amber-700 transition-all hover:-translate-y-1 active:scale-[0.99] relative"
        >
          <div className="absolute top-4 right-4 flex -space-x-1.5 overflow-hidden">
            <div className="inline-block h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[7px] font-bold text-center leading-5">1</div>
            <div className="inline-block h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[7px] font-bold text-center leading-5">2</div>
            <div className="inline-block h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[7px] font-bold text-center leading-5">3</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">커피 응원 후원</h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              후원을 통해 운영비를 지원하고 핵심 기능 개선 속도를 함께 높여주세요.
            </p>
          </div>
          <button className="mt-1 px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2">
            토스 / 카카오페이 후원
          </button>
        </div>
      </div>

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
              onClick={(e) => e.stopPropagation()}
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
                  <p className="text-[11px] font-bold text-slate-400">월 9,900원 정액 결제</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
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
                {upgrading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {upgrading ? "결제창 열기..." : "결제 진행하기"}
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
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-sm text-center"
            >
              <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl shadow-amber-500/10">☕</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">커피 후원하기</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">서비스 안정성과 속도 개선을 위해 자유롭게 후원해 주세요.</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCoffee}
                  className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                >
                  커피 3,000원
                </button>
                <button
                  onClick={handleCoffee}
                  className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                >
                  커피 10,000원
                </button>
              </div>
              <button
                onClick={handleCoffee}
                className="mt-3 w-full py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-400 hover:border-amber-300 transition-colors"
              >
                후원금 직접 전송
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
