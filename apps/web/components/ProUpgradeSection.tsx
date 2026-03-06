"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Crown, Coffee, Zap, CheckCircle2 } from "lucide-react";

const PRO_FEATURES = [
  {
    icon: "🚀",
    title: "AI 추천 우선 배치",
    desc: "검색/정렬 조건을 반영한 추천 캠페인을 우선순위로 보여줍니다.",
  },
  {
    icon: "📆",
    title: "D-day 알림 알림 강화",
    desc: "남은 시간 마감 임박 캠페인을 우선 순위로 알림해 놓치지 않게 돕습니다.",
  },
  {
    icon: "📈",
    title: "운영 통합 성과 분석",
    desc: "지원 수·모집 수·전환율 데이터를 한 화면에서 볼 수 있도록 정리해 줍니다.",
  },
  {
    icon: "🔒",
    title: "일정/알림 자동화",
    desc: "카카오톡·이메일·푸시의 알림 규칙을 자동으로 설정해서 운영 부담을 줄여줍니다.",
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
              <span className="text-[11px] font-black uppercase tracking-widest opacity-80">멤버십 업그레이드</span>
            </div>
            <h3 className="text-2xl font-black mb-1">PRO 전환</h3>
            <p className="text-[13px] font-bold opacity-75 mb-5">월 9,900원에 AI 추천, D-day 알림, 관리자 분석을 한 번에 사용할 수 있습니다.</p>
            <div className="flex items-end gap-1 mb-5">
              <span className="text-3xl font-black">9,900</span>
              <span className="text-sm opacity-60 mb-1">원/월</span>
            </div>
            <button className="px-6 py-2.5 bg-white text-blue-600 rounded-2xl text-[11px] font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
              PRO로 전환하기
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
            <h3 className="text-sm font-black text-slate-900 dark:text-white">개발자 후원</h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              커피 한 잔 후원으로 운영 안정성 유지에 도움을 주세요. 지속 운영에 큰 힘이 됩니다.
            </p>
          </div>
          <button className="mt-1 px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2">
            후원 / 오픈카톡 지원
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
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">PRO 전환</h3>
                  <p className="text-[11px] font-bold text-slate-400">월 9,900원 결제 진행</p>
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
                {upgrading ? "결제 중..." : "결제 진행하기"}
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
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">후원하러 가기</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                후원 링크로 간편하게 후원해주시면 운영 개선과 서버 안정화에 큰 도움이 됩니다.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCoffee}
                  className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                >
                  후원 3,000원
                </button>
                <button
                  onClick={handleCoffee}
                  className="py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
                >
                  후원 10,000원
                </button>
              </div>
              <button
                onClick={handleCoffee}
                className="mt-3 w-full py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-400 hover:border-amber-300 transition-colors"
              >
                기타 금액으로 후원
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
