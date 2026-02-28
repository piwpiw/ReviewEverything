"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";
import { ListFilter } from "lucide-react";

const SORTS = [
    { key: "latest_desc", label: "최신순" },
    { key: "deadline_asc", label: "마감임박" },
    { key: "reward_desc", label: "제안금액순" },
    { key: "applicant_desc", label: "인기순" },
    { key: "competition_asc", label: "당첨확률순" },
];

export default function SortBar({ currentSort }: { currentSort: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, start] = useTransition();

    const handleSort = (val: string) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set("sort", val);
        start(() => router.push("/?" + p.toString(), { scroll: false }));
    };

    return (
        <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-2 text-slate-400 shrink-0 border-r border-slate-100 pr-4">
                <ListFilter className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black tracking-widest uppercase">Sort</span>
            </div>

            <div className="flex items-center gap-1">
                {SORTS.map(s => {
                    const active = currentSort === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => handleSort(s.key)}
                            className={`relative px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap overflow-hidden ${active ? "text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="sort-capsule"
                                    className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                                />
                            )}
                            {s.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
