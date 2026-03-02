"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function SearchGuidePanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 p-5 md:p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-left">
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white">체험단 검색은 행정구역 + 핵심 키워드가 가장 정확합니다</p>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
            지역부터 입력하고 최소 의미 단어를 붙이면 더 빠르게 정확한 결과가 정렬됩니다.
          </p>
        </div>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-sm font-black text-white"
          aria-expanded={open}
        >
          <span>{open ? "가이드 접기" : "가이드 펼치기"}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 text-left">
          <div className="rounded-2xl border border-blue-200/70 dark:border-blue-800/60 p-4 bg-blue-50/70 dark:bg-blue-900/20">
            <p className="text-xs font-black text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Search className="w-4 h-4" />
              추천 검색 공식
            </p>
            <p className="mt-2 text-sm font-black text-slate-700 dark:text-slate-200">
              행정구역 + 최소 의미 단어
            </p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>서울 강남 카페</li>
              <li>부산 해운대 초밥</li>
              <li>제주 펜션</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">운영 체크</p>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              현재 20,000개 이상의 체험 건을 통합 수집하고 있으며,
              지역 + 키워드 + 유형 조합으로 정확도를 높였습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">운영 팁</p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>검색은 지역 + 키워드 조합을 우선하세요.</li>
              <li>문장이 길면 핵심 단어 2~3개로 줄여보세요.</li>
              <li>결과가 적으면 시군구(강남/해운대/명동)로 좁혀 보세요.</li>
              <li>동의어(숙박=펜션=호텔)도 함께 사용하면 좋아요.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">정렬/필터</p>
            <ul className="mt-2 space-y-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li>D-Day 임박순으로 마감이 빠른 공고를 우선 확인하세요.</li>
              <li>경쟁률이 낮을수록 합격 가능성이 높은 편입니다.</li>
              <li>카테고리/플랫폼/매체 필터로 1차 축소 후 검색하세요.</li>
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

