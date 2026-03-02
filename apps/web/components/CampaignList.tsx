"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CampaignCard from "./CampaignCard";
import MapView from "./MapViewCompat";
import ListSkeleton from "./ListSkeleton";
import { X, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type CampaignsResponse = {
  campaigns: any[];
  total: number;
  meta?: { page: number; limit: number; totalPages: number };
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

const MAP_VIEW_LIMIT = 320;

const buildQueryString = (input: SearchParamsInput) => {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => v && params.append(key, v));
      return;
    }
    if (String(value).length === 0) return;
    params.set(key, String(value));
  });
  return params.toString();
};

export default function CampaignList({
  searchParams,
  viewMode,
}: {
  searchParams: SearchParamsInput;
  viewMode: "list" | "map" | string;
}) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParamsEntries = useMemo(() => Object.entries(searchParams), [searchParams]);

  const query = useMemo(() => {
    const next = Object.fromEntries(searchParamsEntries) as SearchParamsInput;
    if (viewMode === "map") {
      next.page = "1";
      next.limit = String(MAP_VIEW_LIMIT);
    }
    return buildQueryString(next);
  }, [searchParamsEntries, viewMode]);

  useEffect(() => {
    let canceled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/campaigns?${query}`);
        if (!res.ok) throw new Error(`데이터 조회 실패 (${res.status})`);
        const json = (await res.json()) as CampaignsResponse;
        if (!canceled) setData(json);
      } catch (err: unknown) {
        if (canceled) return;
        setError(err instanceof Error ? err.message : "데이터 조회 중 알 수 없는 오류가 발생했습니다.");
        setData(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void fetchData();

    return () => {
      canceled = true;
    };
  }, [query]);

  if (loading && !data) return <ListSkeleton />;

  if (error) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700 flex flex-col items-center">
        <p className="text-sm font-black">데이터 조회 오류</p>
        <p className="text-sm font-bold opacity-80 mt-2">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg"
        >
          페이지 새로고침
        </button>
      </div>
    );
  }

  const campaigns = data?.campaigns || [];
  const total = data?.total || 0;
  const meta = data?.meta;

  const removeFilter = (key: string) => {
    const next = new URLSearchParams(currentParams.toString());
    next.delete(key);
    router.push("/?" + next.toString(), { scroll: false });
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(currentParams.toString());
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    router.push("/?" + next.toString(), { scroll: false });
  };

  if (campaigns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-40 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm"
      >
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 relative text-slate-300">
          <FilterX className="w-10 h-10" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl">
            <span className="text-xs font-black">0</span>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">조건에 맞는 캠페인이 없습니다</h3>
        <p className="text-lg text-slate-400 font-bold mb-10 max-w-md text-center leading-relaxed">
          필터를 변경하거나 검색어를 다르게 설정해보세요.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] text-[13px] font-black hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
        >
          <FilterX className="w-5 h-5" />
          검색 초기화하기
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 px-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-100 dark:border-slate-800 mr-2">
            <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap">
              총 <span className="text-blue-600 dark:text-blue-400 font-black px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg ml-1">{total.toLocaleString()}</span>개
            </p>
          </div>

          <AnimatePresence>
            {Object.entries(searchParams).map(([key, value]) => {
              if (!value || ["view", "sort", "page"].includes(key)) return null;
              const label = key === "q" ? `키워드: ${String(value)}` : `${key}: ${String(value)}`;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => removeFilter(key)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-500 hover:border-rose-500 hover:text-rose-500 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {label}
                  <X className="w-3 h-3 opacity-50" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <MapView campaigns={campaigns} />
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7 gap-3"
          >
            {campaigns.map((campaign: any, i: number) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                rank={searchParams.sort === "applicant_desc" ? i + 1 : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {meta && meta.totalPages > 1 && viewMode !== "map" ? (
        <div className="mt-20 flex justify-center pb-12">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 rounded-[1.25rem] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => setPage(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1}
              className="w-10 h-10 rounded-xl text-xs font-black transition-all disabled:opacity-20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-4">
              <span className="text-[13px] font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center gap-3">
                <span className="opacity-40 whitespace-nowrap">페이지</span>
                <span className="bg-slate-900 dark:bg-blue-600 text-white px-2.5 py-1 rounded-lg shadow-lg shadow-blue-500/20">{meta.page}</span>
                <span className="opacity-40">/ {meta.totalPages}</span>
              </span>
            </div>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}
              disabled={meta.page >= meta.totalPages}
              className="w-10 h-10 rounded-xl text-xs font-black transition-all disabled:opacity-20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
