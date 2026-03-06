"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { ListFilter } from "lucide-react";

const SORTS = [
  { key: "latest_desc", label: "최신순" },
  { key: "deadline_asc", label: "마감 임박" },
  { key: "reward_desc", label: "보상 높은순" },
  { key: "applicant_desc", label: "지원 많은순" },
  { key: "competition_asc", label: "경쟁률 낮은순" },
];

export default function SortBar({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, start] = useTransition();

  const handleSort = (val: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!val || val === "latest_desc") next.delete("sort");
    else next.set("sort", val);
    start(() => router.push("/?" + next.toString(), { scroll: false }));
  };

  return (
    <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 shrink-0 pr-2 border-r border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          <ListFilter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase">정렬</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {SORTS.map((sort) => {
          const active = currentSort === sort.key || (!currentSort && sort.key === "latest_desc");
          return (
            <button
              key={sort.key}
              onClick={() => handleSort(sort.key)}
              className={`relative px-3 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${
                active
                  ? "text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              {active ? (
                <motion.div
                  layoutId="sort-capsule"
                  className="absolute inset-0 bg-slate-900 dark:bg-blue-600 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                />
              ) : null}
              <span className="relative z-10">{sort.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
