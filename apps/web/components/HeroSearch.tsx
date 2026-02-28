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

    const TRENDING = ["성수동 카페", "바디워시 협찬", "강남 오마카세", "갤럭시 워치", "인천 배송체험", "유튜브 브이로그"];
    const CATEGORIES = [
        { name: "맛집/카페", icon: "🍽️", count: "1,240+" },
        { name: "뷰티/코스메틱", icon: "💄", count: "850+" },
        { name: "패션/의류", icon: "🧣", count: "320+" },
        { name: "디지털/가전", icon: "💻", count: "150+" },
        { name: "도서/문화", icon: "📚", count: "90+" },
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
                    onChange={e => setQ(e.target.value)}
                    placeholder="찾으시는 체험단, 플랫폼, 리워드를 검색하세요..."
                    className="w-full pl-14 pr-36 py-5 rounded-[1.75rem] bg-white border-2 border-slate-100 text-base font-bold outline-none ring-offset-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 shadow-2xl shadow-slate-900/5"
                />
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-300'}`}>
                    <Search className="w-6 h-6 stroke-[2.5]" />
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {q && (
                        <button
                            type="button"
                            onClick={() => setQ('')}
                            className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 group-hover:shadow-blue-500/20"
                    >
                        검색
                    </button>
                </div>
            </form>

            {/* Premium Suggestion Engine Overlay */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden p-8 flex flex-col gap-8"
                    >
                        {/* Section 1: Trending Now */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <TrendingUp className="w-4 h-4 text-rose-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">실시간 인기 검색어</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING.map((term, i) => (
                                    <button
                                        key={term}
                                        onClick={() => { setQ(term); router.push(`/?q=${term}`); setIsFocused(false); }}
                                        className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-blue-100 flex items-center gap-2"
                                    >
                                        <span className="text-slate-300 font-black">{i + 1}</span>
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Premium Discovery Icons */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">테마별 모아보기</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.name}
                                        onClick={() => { router.push(`/?q=${cat.name}`); setIsFocused(false); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100 group/cat"
                                    >
                                        <span className="text-2xl group-hover/cat:scale-110 transition-transform">{cat.icon}</span>
                                        <span className="text-[11px] font-extrabold text-slate-900">{cat.name}</span>
                                        <span className="text-[9px] font-black text-blue-500 opacity-60">{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 3: History (Mock) */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-300">
                                <History className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">최근 검색어는 기기에 안전하게 저장됩니다.</span>
                            </div>
                            <button className="text-[10px] font-black text-rose-500 hover:underline">기록 삭제</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
    )
}
