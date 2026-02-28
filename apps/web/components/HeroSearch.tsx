"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSearch({ defaultValue }: { defaultValue: string }) {
    const [q, setQ] = useState(defaultValue);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        router.push("/?" + params.toString());
    };

    const QUICK_TAGS = [
        "#성수맛집", "#강남뷰티", "#피부관리", "#다이닝", "#카페", "#인스타협찬", "#배송체험단", "#화장품", "#육아제품"
    ];

    return (
        <div>
            <form onSubmit={handleSubmit} className="relative group max-w-2xl">
                <input
                    type="text"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="맛집, 뷰티, 키워드로 검색..."
                    className="w-full pl-14 pr-36 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-200 text-base font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-300 shadow-lg shadow-slate-200/40"
                    autoFocus
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                >
                    검색
                </button>
            </form>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => router.push(`/?q=${tag.replace("#", "")}`)}
                        className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}
