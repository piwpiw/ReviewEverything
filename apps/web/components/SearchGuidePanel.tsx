"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function SearchGuidePanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 p-5 md:p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-left">
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
            지역, 유형, 키워드를 함께 고르면 원하는 캠페인을 더 빠르게 찾을 수 있습니다.
          </p>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            플랫폼, 매체, 지역, 카테고리를 교차 선택하면 결과를 더 정확하게 압축할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white dark:bg-blue-600"
          aria-expanded={open}
        >
          <span>{open ? "안내 접기" : "안내 펼치기"}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-800/60 dark:bg-blue-900/20">
            <p className="flex items-center gap-2 text-xs font-black text-blue-700 dark:text-blue-300">
              <Search className="h-4 w-4" />
              빠른 검색법
            </p>
            <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">
              지역 + 카테고리 + 키워드 조합
            </p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>찾고 싶은 캠페인 키워드를 먼저 입력합니다.</li>
              <li>지역 필터로 범위를 좁힙니다.</li>
              <li>캠페인 유형과 매체를 마지막에 고릅니다.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">추천 기준</p>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              결과가 너무 많으면 플랫폼과 지역을 먼저 고정하고, 그다음 보상과 마감일 기준으로 줄이는 편이 안정적입니다.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">추천 검색 예시</p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>서울 + 카페 + 방문형</li>
              <li>뷰티 + 체험단 + 마감 임박</li>
              <li>맛집 + 강남 + 보상 높은 순</li>
              <li>육아 + 제품형 + 경쟁률 낮은 순</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">운영 체크</p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>D-Day 캠페인은 마감 직전 변동 여부를 우선 확인합니다.</li>
              <li>지원자가 급증하면 경쟁률과 상태 라벨을 함께 봅니다.</li>
              <li>지도와 리스트를 번갈아 보며 위치와 조건을 같이 확인합니다.</li>
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
