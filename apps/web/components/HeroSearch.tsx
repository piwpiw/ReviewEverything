"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Clock, History, X } from "lucide-react";

export default function HeroSearch({ defaultValue }: { defaultValue: string }) {
  const [q, setQ] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const TRENDING = ["뷔페", "오픈런", "신규 매장", "카페 체험", "로컬 리뷰", "맛집 탐색"];
  const CATEGORIES = [
    { name: "체험형", icon: "🧭", count: "1,240+" },
    { name: "방문형", icon: "📍", count: "850+" },
    { name: "구매형", icon: "🛒", count: "320+" },
    { name: "홍보형", icon: "📣", count: "150+" },
    { name: "근거리", icon: "🚗", count: "90+" },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push("/?" + params.toString());
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative z-[60] w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={q}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="캠페인 제목, 지역, 브랜드를 검색하세요..."
          className="w-full pl-14 pr-36 py-5 rounded-[1.75rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-base font-bold outline-none ring-offset-4 dark:ring-offset-slate-950 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-2xl shadow-slate-900/5 dark:shadow-blue-900/10 text-slate-900 dark:text-white"
        />
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? "text-blue-600 dark:text-blue-500" : "text-slate-300 dark:text-slate-600"}`}>
          <Search className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="p-2 text-slate-300 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-black text-sm transition-all shadow-xl dark:shadow-blue-900/20 active:scale-95"
          >
            검색
          </button>
        </div>
      </form>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute top-[110%] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden p-8 flex flex-col gap-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                <TrendingUp className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">실시간 인기 검색어</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQ(term);
                      router.push(`/?q=${term}`);
                      setIsFocused(false);
                    }}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 flex items-center gap-2"
                  >
                    <span className="text-slate-300 dark:text-slate-600 font-black">{i + 1}</span>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">빠른 탐색</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      router.push(`/?q=${cat.name}`);
                      setIsFocused(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group/cat"
                  >
                    <span className="text-2xl group-hover/cat:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 opacity-60">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600">
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">최근 검색어는 현재 저장되지 않습니다.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
