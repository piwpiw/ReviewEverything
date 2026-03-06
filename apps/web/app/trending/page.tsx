"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, RefreshCw, SearchX, Sparkles, TrendingUp } from "lucide-react";

type CampaignSnapshot = {
  recruit_count?: number;
  applicant_count?: number;
};

type TrendingCampaign = {
  id: number | string;
  title: string;
  reward_value?: number | null;
  reward_text?: string | null;
  image_url?: string | null;
  snapshots?: CampaignSnapshot[];
  trend_score?: number | null;
};

type DataSource = "live" | "fallback";

const SOURCE_LABEL: Record<DataSource, string> = {
  live: "실시간 분석",
  fallback: "DB 폴백",
};

const resolveItems = (items: TrendingCampaign[]) =>
  items.map((item, idx) => {
    const recruit = Math.max(1, item.snapshots?.[0]?.recruit_count || 10);
    const applicants = Math.max(0, item.snapshots?.[0]?.applicant_count || 0);
    return {
      ...item,
      image: item.image_url || "/images/campaign-placeholder.webp",
      reward: item.reward_text || (item.reward_value ? `${item.reward_value.toLocaleString()}원` : "보상은 개별 안내"),
      rankRatio: applicants / recruit,
      recruit,
      applicants,
      rank: idx + 1,
    };
  });

export default function TrendingPage() {
  const [campaigns, setCampaigns] = useState<TrendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("live");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      setFallbackMessage(null);

      try {
        const analyticsRes = await fetch("/api/analytics", { signal: controller.signal });
        if (!analyticsRes.ok) {
          throw new Error(`실시간 트렌드 조회 실패 (${analyticsRes.status})`);
        }

        const analyticsPayload = await analyticsRes.json();
        const list = Array.isArray(analyticsPayload?.data) ? analyticsPayload.data : [];
        if (list.length > 0) {
          setCampaigns(list as TrendingCampaign[]);
          setDataSource("live");
          return;
        }

        throw new Error("트렌드 응답이 비어있습니다.");
      } catch (e) {
        if (controller.signal.aborted) return;
        setDataSource("fallback");
        setError(e instanceof Error ? e.message : "트렌드 조회에 실패해 폴백 데이터를 사용합니다.");
        setFallbackMessage("실시간 API 응답이 비어 DB 폴백으로 전환했습니다.");

        try {
          const fallbackRes = await fetch("/api/campaigns?sort=applicant_desc&limit=10", { signal: controller.signal });
          if (fallbackRes.ok) {
            const payload = await fallbackRes.json();
            const fallbackList = Array.isArray(payload?.data) ? payload.data : [];
            if (fallbackList.length > 0) {
              setCampaigns(fallbackList as TrendingCampaign[]);
              return;
            }
          }

          setFallbackMessage("폴백 데이터가 없어 빈 상태로 표시합니다.");
          setCampaigns([]);
          setDataSource("fallback");
        } catch {
          setFallbackMessage("연동 실패로 빈 상태를 표시합니다.");
          setCampaigns([]);
          setDataSource("fallback");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [refreshTick]);

  const items = useMemo(() => resolveItems(campaigns).slice(0, 10), [campaigns]);
  const spotlight = items.slice(0, 4);
  const compact = items.slice(4, 10);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="page-shell page-stack gap-4">
        <section className="section-card p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="section-title inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                트렌드 센터
              </p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white inline-flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                실시간 인기 캠페인
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-bold">
                데이터 소스: <span className="text-blue-600 dark:text-blue-300">{SOURCE_LABEL[dataSource]}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRefreshTick((prev) => prev + 1)}
              disabled={loading}
              aria-label="실시간 트렌드 데이터를 다시 조회"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-300/60 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 text-xs font-black focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              실시간 재조회
            </button>
          </div>

          {error ? <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
          {fallbackMessage ? (
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-amber-300/40 bg-amber-100/40 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {fallbackMessage}
              <Link href="/?sort=latest_desc" className="underline font-black">
                목록으로 이동
              </Link>
            </div>
          ) : null}
        </section>

        {loading ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse" />
            ))}
          </section>
        ) : items.length === 0 ? (
          <section className="section-card p-10 text-center">
            <div className="inline-flex flex-col items-center gap-4 text-slate-500 dark:text-slate-300">
              <SearchX className="w-8 h-8 text-slate-300" />
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">표시 가능한 트렌드가 없습니다.</p>
                <p className="text-xs text-slate-500">실시간 API와 DB 폴백이 모두 비어있습니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRefreshTick((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  다시 조회
                </button>
                <a href="/?sort=applicant_desc" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-colors">
                  전체 목록으로
                </a>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {spotlight.map((item) => (
                <Link
                  key={item.id}
                  href={`/campaigns/${item.id}`}
                  aria-label={`${item.title} 상세 보기`}
                  className="section-card overflow-hidden group transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="relative h-36">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 chip-muted bg-white/85 dark:bg-slate-900/85">TOP {item.rank}</div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs font-black">경쟁률 {item.rankRatio.toFixed(1)}:1</p>
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 font-bold">{item.reward}</p>
                  </div>
                </Link>
              ))}
            </section>

            <section className="section-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">추가 인기 목록</h2>
                <span className="chip-muted">실시간 연동</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {compact.map((item) => (
                  <Link
                    key={item.id}
                    href={`/campaigns/${item.id}`}
                    aria-label={`${item.title} 상세 페이지 이동`}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center gap-3 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {item.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">{item.applicants}/{item.recruit} · {item.reward}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
