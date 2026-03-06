"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, History, Search, TrendingUp, X, Loader2, Sparkles } from "lucide-react";

type SuggestResponse = {
  suggestions: string[];
  correction: string | null;
  estimatedTotal: number | null;
};

const TRENDING = ["서울 강남", "제주 펜션", "부산 해운대", "카페 창업", "반려동물 카페"];
const CATEGORIES = [
  { name: "방문형", icon: "🏨", count: "1,200+" },
  { name: "쇼핑형", icon: "🛍️", count: "850+" },
  { name: "구매형", icon: "🧾", count: "520+" },
  { name: "SNS형", icon: "📸", count: "310+" },
  { name: "이벤트형", icon: "🎯", count: "190+" },
];

export default function HeroSearch({ defaultValue }: { defaultValue: string }) {
  const [q, setQ] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [correction, setCorrection] = useState<string | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("re_recent_searches");
    if (saved) {
      try {
        setRecents(JSON.parse(saved));
      } catch {
        setRecents([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFocused || q.trim().length < 2) {
      setSuggestions([]);
      setEstimatedTotal(null);
      setCorrection(null);
      setLoadingSuggest(false);
      return;
    }

    const controller = new AbortController();
    const keyword = q.trim();

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggest(true);
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(keyword)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("제안어를 불러오지 못했습니다.");
        const payload = (await res.json()) as SuggestResponse;
        setSuggestions(payload.suggestions || []);
        setEstimatedTotal(payload.estimatedTotal ?? null);
        setCorrection(payload.correction || null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setEstimatedTotal(null);
          setCorrection(null);
        }
      } finally {
        setLoadingSuggest(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isFocused, q]);

  const saveRecent = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;

    const next = [normalized, ...recents.filter((r) => r !== normalized)].slice(0, 5);
    setRecents(next);
    localStorage.setItem("re_recent_searches", JSON.stringify(next));
  };

  const removeRecent = (term: string) => {
    const next = recents.filter((r) => r !== term);
    setRecents(next);
    localStorage.setItem("re_recent_searches", JSON.stringify(next));
  };

  const applySearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    saveRecent(normalized);
    setQ(normalized);
    setIsFocused(false);
    router.push(`/?q=${encodeURIComponent(normalized)}`);
  };

  const applyCorrected = () => {
    if (!correction) return;
    applySearch(correction);
  };

  const applySubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (term) {
      applySearch(term);
    } else {
      router.push("/");
      setIsFocused(false);
    }
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const resultCountText =
    estimatedTotal === null ? null : estimatedTotal > 0 ? `예상 ${estimatedTotal.toLocaleString()}개 결과` : "검색 결과 없음";

  return (
    <div ref={containerRef} className="relative z-[60] w-full max-w-2xl">
      <form onSubmit={applySubmit} className="relative group">
        <input
          type="text"
          value={q}
          onFocus={() => setIsFocused(true)}
          onChange={(event) => setQ(event.target.value)}
          placeholder="검색어를 입력하세요. 예: 서울 강남, 제주 펜션"
          className="w-full pl-12 pr-28 py-4 rounded-[1.35rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-sm md:text-base font-bold outline-none ring-offset-4 dark:ring-offset-slate-950 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xl shadow-slate-900/5 dark:shadow-blue-900/10 text-slate-900 dark:text-white"
        />
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
            isFocused ? "text-blue-600 dark:text-blue-500" : "text-slate-300 dark:text-slate-600"
          }`}
        >
          <Search className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="p-2 text-slate-300 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
              aria-label="입력 초기화"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs md:text-sm transition-all shadow-xl dark:shadow-blue-900/20 active:scale-95"
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
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-[106%] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[1.75rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden p-5 flex flex-col gap-5"
          >
            {(correction || resultCountText || loadingSuggest) && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                {loadingSuggest ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>검색어 추천을 확인하는 중...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {correction ? (
                      <button
                        type="button"
                        onClick={applyCorrected}
                        className="text-left text-blue-700 underline-offset-2 hover:underline dark:text-blue-200"
                      >
                        오타로 보입니다. “{correction}”로 검색해보시겠어요?
                      </button>
                    ) : null}
                    {resultCountText ? <span>{resultCountText}</span> : null}
                  </div>
                )}
              </div>
            )}

            {suggestions.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">자동완성</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => applySearch(term)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 border border-blue-100 dark:border-blue-900 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {recents.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                  <History className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">최근 검색어</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recents.map((term) => (
                    <div
                      key={term}
                      className="group/tag flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => applySearch(term)}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors mr-2"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(term)}
                        className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                        aria-label={`${term} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                <TrendingUp className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">인기 검색어</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((term) => (
                  <button
                    type="button"
                    key={term}
                    onClick={() => applySearch(term)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 flex items-center gap-2"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500">
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">카테고리 바로가기</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => applySearch(cat.name)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group/cat"
                  >
                    <span className="text-2xl group-hover/cat:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 opacity-60">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
