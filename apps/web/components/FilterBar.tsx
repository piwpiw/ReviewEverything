"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = [
  { id: "", label: "전체" },
  { id: "1", label: "레뷰" },
  { id: "2", label: "리뷰노트" },
  { id: "3", label: "디너의여왕" },
  { id: "4", label: "리뷰플레이스" },
  { id: "5", label: "서울오빠" },
  { id: "6", label: "미스터블로그" },
  { id: "7", label: "강남맛집" },
];
const TYPES = [
  { id: "", label: "유형 전체" },
  { id: "VST", label: "🍽 방문형" },
  { id: "SHP", label: "📦 배송형" },
  { id: "PRS", label: "📰 기자단" },
];
const MEDIAS = [
  { id: "", label: "매체 전체" },
  { id: "BP", label: "✍️ 블로그" },
  { id: "IP", label: "📸 인스타" },
  { id: "YP", label: "🎬 유튜브" },
];

function Pills({
  items,
  current,
  name,
  onSelect,
}: {
  items: { id: string; label: string }[];
  current: string;
  name: string;
  onSelect: (name: string, val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(name, item.id)}
            className={`pill-btn ${active ? "active" : ""}`}
          >
            {active && (
              <motion.span
                layoutId={`pill-${name}`}
                className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
              />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQS = useCallback(
    (name: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value) p.set(name, value);
      else p.delete(name);
      return p.toString();
    },
    [searchParams]
  );

  const handleSelect = (name: string, val: string) => {
    startTransition(() => {
      router.push("/?" + createQS(name, val), { scroll: false });
    });
  };

  const cur = {
    platform: searchParams.get("platform_id") ?? "",
    type: searchParams.get("campaign_type") ?? "",
    media: searchParams.get("media_type") ?? "",
  };

  const activeCount = [cur.platform, cur.type, cur.media].filter(Boolean).length;

  return (
    <div className="glass-card rounded-[1.75rem] border border-white/60 shadow-lg shadow-slate-900/5 px-5 py-5">
      <div className="flex flex-col gap-4">
        {/* Row 1: Platforms */}
        <div className="flex items-start gap-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-10 shrink-0">플랫폼</span>
          <Pills items={PLATFORMS} current={cur.platform} name="platform_id" onSelect={handleSelect} />
        </div>
        {/* Row 2 & 3 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-10 shrink-0">유형</span>
            <Pills items={TYPES} current={cur.type} name="campaign_type" onSelect={handleSelect} />
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-10 shrink-0">매체</span>
            <Pills items={MEDIAS} current={cur.media} name="media_type" onSelect={handleSelect} />
          </div>
        </div>
      </div>

      {/* Loading + Reset */}
      <div className="mt-3.5 flex items-center justify-between">
        <AnimatePresence>
          {isPending && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600"
            >
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              데이터 로딩 중...
            </motion.div>
          )}
        </AnimatePresence>

        {activeCount > 0 && (
          <button
            onClick={() => router.push("/", { scroll: false })}
            className="ml-auto text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            필터 초기화 ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
