"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";

const SORTS = [
    { key: "latest_desc", label: "최신순" },
    { key: "deadline_asc", label: "마감임박순" },
    { key: "competition_asc", label: "경쟁률낮은순" },
];

export default function SortBar({ currentSort }: { currentSort: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, start] = useTransition();

    const createQS = useCallback(
        (val: string) => {
            const p = new URLSearchParams(searchParams.toString());
            p.set("sort", val);
            return p.toString();
        },
        [searchParams]
    );

    return (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {SORTS.map(s => {
                const active = currentSort === s.key;
                return (
                    <button
                        key={s.key}
                        onClick={() => start(() => router.push("/?" + createQS(s.key), { scroll: false }))}
                        className={`relative px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${active ? "text-white" : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        {active && (
                            <motion.div
                                layoutId="sort-tab"
                                className="absolute inset-0 bg-slate-900 rounded-lg -z-10"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                            />
                        )}
                        {s.label}
                    </button>
                );
            })}
        </div>
    );
}
