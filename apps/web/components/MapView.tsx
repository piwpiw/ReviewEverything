"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Info, Navigation, Search, X } from "lucide-react";

declare global {
  interface Window {
    kakao: any;
    naver: any;
  }
}

type Campaign = {
  id?: string | number;
  title?: string;
  campaign_type?: string;
  lat?: number | string;
  lng?: number | string;
  thumbnail_url?: string;
  region_depth1?: string;
  region_depth2?: string;
  url?: string;
  geo_match_source?: string;
  geo_match_score?: number;
  geo_store_key?: string;
  reward_text?: string;
};

type CampaignGroup = {
  key: string;
  lat: number;
  lng: number;
  storeKey: string;
  source: string;
  score: number;
  campaigns: Campaign[];
  representative: Campaign;
};

type MapEngine = "kakao" | "naver";

const TYPE_LABEL: Record<string, string> = {
  VST: "방문형",
  SHP: "쇼핑형",
  PRS: "구매형",
  SNS: "SNS형",
  EVT: "이벤트형",
  APP: "앱형",
  PRM: "홍보형",
  ETC: "기타",
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCoord = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const compact = value.trim().replace(/\s+/g, "");
  if (!compact) return null;

  const match = compact.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const MAP_GROUP_LIMIT = Math.max(1, Number(process.env.NEXT_PUBLIC_MAP_GROUP_LIMIT) || 180);
const MAX_MERGE_RADIUS = Math.max(120, Number(process.env.NEXT_PUBLIC_MAP_MAX_MERGE_RADIUS) || 600);
const MERGE_RADIUS_BASE = Math.max(120, Number(process.env.NEXT_PUBLIC_MAP_MERGE_RADIUS_BASE) || 300);

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1000;
};

const matchGrade = (score?: number) => {
  if (!score) return "낮음";
  if (score >= 0.9) return "높음";
  if (score >= 0.7) return "중간";
  return "낮음";
};

const mapSourceLabel = (source: string) => {
  if (source === "explicit") return "직접";
  if (source === "url_coords") return "URL";
  if (source === "region_center") return "지역";
  return "추정";
};

const STOP_WORDS = new Set(["review", "campaign", "detail", "home", "event", "shop", "store", "recruit"]);

const normalizeToken = (value: string) => {
  const normalized = value
    .replace(/https?:\/\/(www\.)?/, "")
    .replace(/[/?#].*$/, "")
    .replace(/[\[\]\(\)]/g, " ")
    .replace(/[|<>*'\"!?:;,._\- \\/]+/g, " ")
    .toLowerCase()
    .trim();

  return normalized
    .split(/\s+/)
    .map((part) => (STOP_WORDS.has(part) ? "" : part))
    .filter((part) => part.length > 1)
    .join("");
};

const makeStoreKey = (campaign: Campaign) => {
  const candidates = [
    campaign.title,
    campaign.geo_store_key,
    campaign.url,
    campaign.region_depth1,
    campaign.region_depth2,
  ]
    .filter(Boolean)
    .map((value) => normalizeToken(String(value)))
    .filter((value) => value.length > 1);

  return candidates.find((candidate) => candidate.length > 2) || `store-${campaign.id ?? Date.now()}`;
};

const bucket = (lat: number, lng: number) => `${Math.round(lat * 2500)}-${Math.round(lng * 2500)}`;

const weightedCenter = (group: CampaignGroup, lat: number, lng: number, score: number) => {
  const count = Math.max(1, group.campaigns.length);
  const scoreWeight = Math.max(0.2, Math.min(1.2, score || 0.2));
  const totalWeight = count + scoreWeight;
  return {
    lat: (group.lat * count + lat * scoreWeight) / totalWeight,
    lng: (group.lng * count + lng * scoreWeight) / totalWeight,
  };
};

const mergeRadius = (group: CampaignGroup, score: number) => {
  const sourceBase: Record<string, number> = {
    explicit: 100,
    url_coords: 160,
    region_center: 240,
    heuristic: 360,
  };
  const base = sourceBase[group.source] ?? 300;
  const uncertainty = Math.max(0, (1 - score) * 180);
  return Math.max(MERGE_RADIUS_BASE * 0.6, Math.min(MAX_MERGE_RADIUS, base + uncertainty));
};

const categoryColor = (type?: string) => {
  if (!type) return "#3b82f6";
  if (type.includes("SNS") || type.includes("IP")) return "#ec4899";
  if (type.includes("PRS") || type.includes("APP")) return "#06b6d4";
  return "#3b82f6";
};

const categoryIcon = (type?: string) => {
  if (!type) return "📍";
  if (type.includes("SNS") || type.includes("IP")) return "🎬";
  if (type.includes("PRS") || type.includes("APP")) return "🧩";
  return "🏬";
};

const createMapLabelHtml = (group: CampaignGroup) => {
  const total = group.campaigns.length;
  const source = `${mapSourceLabel(group.source)} (${matchGrade(group.score)})`;
  const repType = group.representative.campaign_type || "ETC";
  const color = categoryColor(repType);
  const icon = categoryIcon(repType);

  return `
    <div style="position:relative; min-width:48px; transform:translate(-50%, -100%);">
      <div style="background:${color}; color:#fff; border:3px solid #fff; border-radius:14px; width:44px; height:44px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:900; box-shadow:0 8px 14px rgba(0,0,0,.3);">
        <span style="font-size:16px; margin-bottom:-2px;">${icon}</span>
        <span style="background:rgba(0,0,0,0.2); width:100%; text-align:center; padding:1px 0;">${total}</span>
      </div>
      <div style="position:absolute; left:50%; transform:translateX(-50%); top:44px; color:#fff; background:${color}ee; border-radius:6px; padding:2px 6px; font-size:10px; white-space:nowrap; font-weight:900; backdrop-filter:blur(4px);">
        ${source}
      </div>
      <div style="position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #fff;"></div>
    </div>
  `;
};

const loadScript = (id: string, src: string) => {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("지도 SDK 로딩에 실패했습니다."));
    document.head.appendChild(script);
  });
};

const waitFor = (predicate: () => unknown, retries = 25, interval = 120) => {
  return new Promise<void>((resolve, reject) => {
    let attempt = 0;
    const tick = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (++attempt > retries) {
        reject(new Error("지도 SDK 초기화 시간 초과"));
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
};

export function MapView({ campaigns }: { campaigns: Campaign[] }) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const failedEnginesRef = useRef<Set<MapEngine>>(new Set());

  const hasKakaoKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim());
  const hasNaverKey = Boolean(process.env.NEXT_PUBLIC_NAVER_CLIENT_ID?.trim());
  const hasMapKey = hasKakaoKey || hasNaverKey;

  const [engine, setEngine] = useState<MapEngine>(() => {
    if (hasNaverKey) return "naver";
    if (hasKakaoKey) return "kakao";
    return "kakao";
  });
  const [activeGroup, setActiveGroup] = useState<CampaignGroup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);

  const pinnedCampaigns = useMemo(() => {
    const grouped = new Map<string, CampaignGroup[]>();

    for (const campaign of campaigns || []) {
      const lat = parseCoord(campaign.lat);
      const lng = parseCoord(campaign.lng);
      if (!Number.isFinite(lat ?? NaN) || !Number.isFinite(lng ?? NaN) || (lat === 0 && lng === 0)) {
        continue;
      }

      const storeKey = makeStoreKey(campaign);
      const source = campaign.geo_match_source || "heuristic";
      const score = toNumber(campaign.geo_match_score) || 0.2;
      const campaignBucket = bucket(lat ?? 0, lng ?? 0);

      const buckets = (grouped.get(storeKey) || []).slice();
      let target: CampaignGroup | null = null;

      for (const group of buckets) {
        const radius = mergeRadius(group, score);
        if (
          distanceMeters(lat ?? 0, lng ?? 0, group.lat, group.lng) <= radius ||
          group.key === `${storeKey}-${campaignBucket}`
        ) {
          target = group;
          break;
        }
      }

      if (!target) {
        const group: CampaignGroup = {
          key: `${storeKey}-${campaignBucket}`,
          lat: lat ?? 0,
          lng: lng ?? 0,
          storeKey,
          source,
          score,
          campaigns: [campaign],
          representative: campaign,
        };
        buckets.push(group);
        grouped.set(storeKey, buckets);
        continue;
      }

      const blended = weightedCenter(target, lat ?? 0, lng ?? 0, score);
      target.lat = blended.lat;
      target.lng = blended.lng;
      target.campaigns.push(campaign);
      if (score > target.score) {
        target.score = score;
        target.source = source;
        target.representative = campaign;
      }
      grouped.set(storeKey, buckets);
    }

    const list = Array.from(grouped.values()).flat();
    list.sort((a, b) => b.campaigns.length - a.campaigns.length || b.score - a.score);
    return list.slice(0, MAP_GROUP_LIMIT);
  }, [campaigns]);

  useEffect(() => {
    if (!hasMapKey || !mapElementRef.current) return;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => marker?.setMap?.(null));
      markersRef.current = [];
      setActiveGroup(null);
      mapInstanceRef.current = null;
      if (mapElementRef.current) mapElementRef.current.innerHTML = "";
      setLoaded(false);
    };

    const buildKakaoMap = async () => {
      const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
      if (!key) throw new Error("카카오 지도 앱키가 등록되지 않았습니다.");

      await loadScript("kakao-map-sdk", `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`);
      if (!window.kakao?.maps) {
        if (typeof window.kakao?.maps?.load === "function") {
          await new Promise<void>((resolve) => window.kakao.maps.load(() => resolve()));
        } else {
          await waitFor(() => Boolean(window.kakao?.maps), 20, 150);
        }
      }

      const map = new window.kakao.maps.Map(mapElementRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 8,
      });
      mapInstanceRef.current = map;

      const bounds = new window.kakao.maps.LatLngBounds();
      for (const group of pinnedCampaigns) {
        const container = document.createElement("div");
        container.innerHTML = createMapLabelHtml(group).trim();
        const node = container.firstElementChild as HTMLElement | null;
        const marker = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(group.lat, group.lng),
          map,
          content: node,
          xAnchor: 0.5,
          yAnchor: 1,
        });
        node?.addEventListener("click", () => {
          setActiveGroup(group);
          map.panTo(new window.kakao.maps.LatLng(group.lat, group.lng));
        });
        markersRef.current.push(marker);
        bounds.extend(new window.kakao.maps.LatLng(group.lat, group.lng));
      }
      if (pinnedCampaigns.length > 0) map.setBounds(bounds);
      setLoaded(true);
    };

    const buildNaverMap = async () => {
      const key = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID?.trim();
      if (!key) throw new Error("네이버 지도 클라이언트 ID가 등록되지 않았습니다.");

      await loadScript("naver-map-sdk", `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${key}&submodules=geocoder`);
      if (!window.naver?.maps) {
        await waitFor(() => Boolean(window.naver?.maps), 20, 150);
      }

      const map = new window.naver.maps.Map(mapElementRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 10,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const bounds = new window.naver.maps.LatLngBounds();
      for (const group of pinnedCampaigns) {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(group.lat, group.lng),
          map,
          title: `${group.representative.title || "캠페인"} (${group.campaigns.length}건)`,
          icon: {
            content: createMapLabelHtml(group),
            anchor: new window.naver.maps.Point(21, 44),
          },
        });
        window.naver.maps.Event.addListener(marker, "click", () => {
          setActiveGroup(group);
        });
        markersRef.current.push(marker);
        bounds.extend(new window.naver.maps.LatLng(group.lat, group.lng));
      }

      if (pinnedCampaigns.length > 0) {
        map.fitBounds(bounds);
      }
      setLoaded(true);
    };

    const render = async () => {
      clearMarkers();
      setSdkError(null);
      try {
        if (engine === "kakao") {
          await buildKakaoMap();
        } else {
          await buildNaverMap();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "지도 렌더링 중 오류가 발생했습니다.";
        setSdkError(message);
        setLoaded(false);
        failedEnginesRef.current.add(engine);

        if (engine === "kakao" && hasNaverKey && !failedEnginesRef.current.has("naver")) {
          setSdkError("카카오 렌더링 실패: 네이버 지도로 자동 전환합니다.");
          setEngine("naver");
          return;
        }
        if (engine === "naver" && hasKakaoKey && !failedEnginesRef.current.has("kakao")) {
          setSdkError("네이버 렌더링 실패: 카카오 지도로 자동 전환합니다.");
          setEngine("kakao");
          return;
        }
      }
    };

    void render();
    return () => clearMarkers();
  }, [engine, hasKakaoKey, hasNaverKey, hasMapKey, pinnedCampaigns]);

  const count = pinnedCampaigns.length;
  const activeCampaign = activeGroup?.representative;
  const activeLocation = [activeCampaign?.region_depth1, activeCampaign?.region_depth2].filter(Boolean).join(" ");

  if (!hasMapKey) {
    return (
      <section className="relative h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-950/50 p-4">
          <div className="mb-4 rounded-xl bg-white/95 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-black text-slate-900 dark:text-white">지도 SDK 키가 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">
              지도 기능을 사용하려면 NEXT_PUBLIC_KAKAO_JS_KEY 또는 NEXT_PUBLIC_NAVER_CLIENT_ID를 등록해 주세요.
            </p>
          </div>
          {count === 0 ? (
            <div className="h-full grid place-items-center text-center rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">현재 캠페인 위치가 없습니다.</p>
                <p className="text-xs text-slate-500 mt-1">
                  필터를 조정하거나 캠페인 좌표 보정 후 다시 시도해 주세요. 지도 키가 없으면 후보 목록으로 표시됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 overflow-y-auto pr-1 max-h-[520px]">
              {pinnedCampaigns.map((group) => {
                const title = group.representative.title || "캠페인";
                const loc = [group.representative.region_depth1, group.representative.region_depth2].filter(Boolean).join(" ");
                const q = encodeURIComponent(`${title} ${loc}`.trim());
                return (
                  <article
                    key={group.key}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {title}
                        <span className="ml-2 text-xs font-medium text-slate-500">({group.campaigns.length}건)</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{loc || "위치 미등록"}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-black shadow"
                    >
                      지도 검색
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 dark:bg-slate-950">
      <div className="absolute top-4 left-4 z-10 flex gap-2 rounded-2xl bg-white/95 p-1.5 shadow-lg border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800">
        <button
          onClick={() => setEngine("kakao")}
          disabled={!hasKakaoKey}
          className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
            engine === "kakao"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
              : "bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800"
          } ${!hasKakaoKey ? "cursor-not-allowed opacity-40" : ""}`}
          title="카카오 지도"
        >
          카카오
        </button>
        <button
          onClick={() => setEngine("naver")}
          disabled={!hasNaverKey}
          className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
            engine === "naver"
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
              : "bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800"
          } ${!hasNaverKey ? "cursor-not-allowed opacity-40" : ""}`}
          title="네이버 지도"
        >
          네이버
        </button>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
        >
          <button
            onClick={() => {
              setIsSearchingArea(true);
              setTimeout(() => setIsSearchingArea(false), 1200);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
          >
            <Search className={`w-3.5 h-3.5 ${isSearchingArea ? "animate-spin" : ""}`} />
            {isSearchingArea ? "지도 갱신 중..." : "지역 이동"}
          </button>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="rounded-xl bg-white/95 px-4 py-2 text-xs font-black shadow-lg border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800 dark:text-white">
          <span className="text-blue-600 mr-1">{count}</span>개 군집 표시
        </div>
        <button
          onClick={() => {
            if (!("geolocation" in navigator)) return;
            navigator.geolocation.getCurrentPosition(
              () => {},
              () => setLocationDenied(true),
            );
          }}
          className="w-10 h-10 rounded-xl bg-white/95 border border-slate-100 flex items-center justify-center shadow-lg text-slate-600 hover:bg-slate-50 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-300"
          aria-label="현재 위치로 이동"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {locationDenied && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 w-[80%] max-w-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <Info className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-900 dark:text-white mb-1">위치 권한이 거부되었습니다.</p>
              <p className="text-[10px] text-slate-500 leading-normal">
                지도의 현재 위치 기능을 사용하려면 브라우저 위치 권한을 허용해 주세요.
              </p>
              <button
                onClick={() => setLocationDenied(false)}
                className="mt-2 text-[10px] font-black text-rose-500 underline"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {count === 0 ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 text-white">
          <p className="rounded-xl bg-black/30 px-5 py-3 text-sm">조건에 맞는 캠페인 좌표가 없습니다.</p>
        </div>
      ) : null}

      {!loaded && count > 0 ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/80">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-4 text-xs font-black text-slate-500 shadow">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            지도 로딩 중입니다...
          </div>
        </div>
      ) : null}

      {sdkError && count > 0 ? (
        <div className="absolute inset-x-4 top-20 z-20 rounded-xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-600 shadow-lg border border-rose-100 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/40">
          {sdkError}
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-500 shadow">
        {engine === "kakao" ? "카카오 지도" : "네이버 지도"}
      </div>

      <button
        onClick={() => {
          if (!mapInstanceRef.current || !navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            if (engine === "kakao" && window.kakao?.maps) {
              mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(latitude, longitude));
            } else if (engine === "naver" && window.naver?.maps) {
              mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(latitude, longitude));
            }
          });
        }}
        className="absolute top-16 right-4 z-10 rounded-xl bg-white/95 p-3 shadow"
        aria-label="지도 중심 이동"
      >
        <Compass className="h-4 w-4" />
      </button>

      <div className="h-full w-full" ref={mapElementRef} />

      <AnimatePresence>
        {activeCampaign ? (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-6 left-6 right-6 z-20 rounded-[2rem] border-0 bg-white/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:bg-slate-900/95"
          >
            <button
              onClick={() => setActiveGroup(null)}
              className="absolute right-5 top-5 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-5">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                <Image
                  src={
                    activeCampaign.thumbnail_url ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format"
                  }
                  alt={activeCampaign.title || "캠페인"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 uppercase tracking-tighter">
                    {TYPE_LABEL[activeCampaign.campaign_type || "ETC"]}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">{activeLocation || "지역 미등록"}</span>
                </div>

                <h3 className="line-clamp-1 text-base font-black tracking-tight text-slate-900 dark:text-white">
                  {activeCampaign.title || "캠페인"}
                </h3>

                <p className="mt-1 text-sm font-bold text-rose-500 line-clamp-1">
                  {activeCampaign.reward_text || "보상 없음"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/campaigns/${activeCampaign.id}`}
                    className="flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] transition-all hover:translate-y-[-2px] hover:bg-blue-700 active:translate-y-0"
                  >
                    상세 확인
                  </Link>
                  <a
                    href={activeCampaign.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 items-center justify-center rounded-xl border-2 border-slate-200 px-5 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    원문 이동
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default MapView;
