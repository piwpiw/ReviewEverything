"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FilterX, X } from "lucide-react";
import CampaignCard from "./CampaignCard";
import CampaignListRow from "./CampaignListRow";
import MapView from "./MapViewCompat";
import ListSkeleton from "./ListSkeleton";

type CampaignsResponse = {
  campaigns: any[];
  total: number;
  meta?: { page: number; limit: number; totalPages: number };
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

const MAP_VIEW_LIMIT = 1200;

const FILTER_LABELS: Record<string, string> = {
  q: "키워드",
  platform_id: "플랫폼",
  campaign_type: "유형",
  media_type: "매체",
  region_depth1: "지역",
  region_depth2: "세부지역",
  category: "카테고리",
  min_reward: "최소보상",
  max_comp: "최대경쟁률",
  max_deadline_days: "D-Day",
};

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
  layoutMode,
}: {
  searchParams: SearchParamsInput;
  viewMode: "list" | "map" | string;
  layoutMode?: "card" | "list";
}) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParamsEntries = useMemo(() => Object.entries(searchParams), [searchParams]);
  const resolvedLayoutMode = layoutMode === "list" ? "list" : "card";

  const query = useMemo(() => {
    const next = Object.fromEntries(searchParamsEntries) as SearchParamsInput;
    if (viewMode === "map") {
      next.page = "1";
      next.limit = String(MAP_VIEW_LIMIT);
    }
    return buildQueryString(next);
  }, [searchParamsEntries, viewMode]);

  const mapViewSearchParams = useMemo(() => {
    const next = new URLSearchParams();
    searchParamsEntries.forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((part) => {
          if (part) next.set(key, String(part));
        });
        return;
      }
      next.set(key, String(value));
    });
    next.set("view", "list");
    return `/?${next.toString()}`;
  }, [searchParamsEntries]);

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

  if (loading && !data) return <ListSkeleton layoutMode={resolvedLayoutMode} />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 flex flex-col items-center">
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
    if (viewMode === "map") {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-black text-slate-500 dark:text-slate-300">조건에 맞는 캠페인이 없습니다.</p>
            <button
              onClick={() => router.push(mapViewSearchParams)}
              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-black"
            >
              목록으로 이동
            </button>
          </div>
          <MapView campaigns={campaigns} fallbackActionHref={mapViewSearchParams} fallbackActionLabel="필터를 조정해 다시 검색" />
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
      >
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 relative text-slate-300">
          <FilterX className="w-8 h-8" />
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl">
            <span className="text-xs font-black">0</span>
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">조건에 맞는 캠페인이 없습니다</h3>
        <p className="text-sm text-slate-400 font-bold mb-8 max-w-md text-center leading-relaxed">
          필터를 변경하거나 검색어를 다르게 설정해보세요.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition-all"
        >
          검색 초기화
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {viewMode === "map" ? (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-black text-slate-500 dark:text-slate-300">
            조건 결과 <span className="text-slate-900 dark:text-white">{total.toLocaleString()}건</span>
          </p>
          <p className="text-[11px] text-slate-500">지도에서 캠페인 위치를 빠르게 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-800 mr-1">
            <p className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">
              총
              <span className="ml-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                {total.toLocaleString()}건
              </span>
            </p>
            <span className="text-[11px] font-black text-slate-400">
              {resolvedLayoutMode === "list" ? "리스트" : "카드"} 보기
            </span>
          </div>

          <AnimatePresence>
            {Object.entries(searchParams).map(([key, value]) => {
              if (!value || ["view", "sort", "page", "layout"].includes(key)) return null;
              const label = `${FILTER_LABELS[key] || key}: ${String(value)}`;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => removeFilter(key)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-500 hover:border-rose-500 hover:text-rose-500 flex items-center gap-1.5"
                >
                  {label}
                  <X className="w-3 h-3 opacity-50" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <MapView campaigns={campaigns} />
          </motion.div>
        ) : (
          <motion.div
            key={`layout-${resolvedLayoutMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              resolvedLayoutMode === "list"
                ? "flex flex-col gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5"
            }
          >
            {campaigns.map((campaign: any, i: number) =>
              resolvedLayoutMode === "list" ? (
                <CampaignListRow
                  key={campaign.id}
                  campaign={campaign}
                  rank={searchParams.sort === "applicant_desc" ? i + 1 : undefined}
                />
              ) : (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  rank={searchParams.sort === "applicant_desc" ? i + 1 : undefined}
                />
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {meta && meta.totalPages > 1 && viewMode !== "map" ? (
        <div className="mt-8 flex justify-center pb-4">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              onClick={() => setPage(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1}
              className="w-9 h-9 rounded-xl text-xs font-black transition-all disabled:opacity-20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-3">
              <span className="text-[12px] font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <span className="opacity-40 whitespace-nowrap">페이지</span>
                <span className="bg-slate-900 dark:bg-blue-600 text-white px-2 py-1 rounded-lg">{meta.page}</span>
                <span className="opacity-40">/ {meta.totalPages}</span>
              </span>
            </div>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}
              disabled={meta.page >= meta.totalPages}
              className="w-9 h-9 rounded-xl text-xs font-black transition-all disabled:opacity-20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
