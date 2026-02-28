"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion } from "framer-motion";

export default function SortBar({ currentSort }: { currentSort: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    const tabs = [
        { key: "latest_desc", label: "최신 등록순" },
        { key: "deadline_asc", label: "마감 임박순" },
        { key: "competition_asc", label: "경쟁률 낮은순" }
    ];

    const [, startTransition] = useTransition();

    const handleSort = (key: string) => {
        startTransition(() => {
            router.push("?" + createQueryString("sort", key), { scroll: false });
        });
    }

    return (
        <div className="flex p-1 bg-slate-100/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-inner">
            {tabs.map(tab => {
                const isActive = currentSort === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => handleSort(tab.key)}
                        className={`relative px-4 py-1.5 text-[11px] font-bold transition-all duration-300 rounded-lg whitespace-nowrap ${isActive ? "text-white" : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="sort-active"
                                className="absolute inset-0 bg-slate-900 rounded-lg -z-10 shadow-md shadow-slate-900/10"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                        )}
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
