"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import React from "react";

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
        { key: "competition_asc", label: "경쟁률 낮은 순(꿀알바)" }
    ];

    const [isPending, startTransition] = React.useTransition();

    const handleSort = (key: string) => {
        startTransition(() => {
            router.push("?" + createQueryString("sort", key), { scroll: false });
        });
    }

    return (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shrink-0">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => handleSort(tab.key)}
                    className={`py-2 px-4 text-sm font-bold rounded-lg transition-all duration-300 ${currentSort === tab.key
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
