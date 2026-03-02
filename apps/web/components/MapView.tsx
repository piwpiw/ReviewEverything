"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, MapPin, X } from "lucide-react";

declare global {
  interface Window {
    kakao: any;
    naver: any;
  }
}

type Campaign = {
  id: string;
  title?: string;
  campaign_type?: string;
  lat?: number | string;
  lng?: number | string;
  thumbnail_url?: string;
  region_depth1?: string;
  region_depth2?: string;
  url?: string;
  shop_url?: string;
  geo_match_source?: string;
  geo_match_score?: number;
  geo_match_label?: string;
  geo_store_key?: string;
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
  SNS: "SNS",
  EVT: "이벤트",
  APP: "앱",
  PRM: "홍보형",
  ETC: "기타",
};

const parseCoord = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const matchGrade = (score?: number) => {
  if (!score) return "낮음";
  if (score >= 0.9) return "높음";
  if (score >= 0.7) return "보통";
  return "낮음";
};

const STORE_KEY_STOP_WORDS = [
  "리뷰",
  "체험단",
  "캠페인",
  "신청",
  "모집",
  "리워드",
  "방문형",
  "배송형",
  "이벤트",
  "블로그",
  "인스타",
  "인스타그램",
  "네이버",
];

const STORE_KEY_STOP_WORD_SET = new Set(STORE_KEY_STOP_WORDS);

const mapLabel = (group: CampaignGroup) => {
  const source = group.source === "explicit" ? "정확" : group.source === "url_coords" ? "URL" : group.source === "region_center" ? "지역" : "추정";
  return `${source} (${matchGrade(group.score)})`;
};

const toDisplayLocation = (group: CampaignGroup) => {
  const first = group.representative;
  return `${first.region_depth1 || ""}${first.region_depth2 ? ` ${first.region_depth2}` : ""}`.trim() || "위치 없음";
};

function waitFor<T>(predicate: () => T | undefined, retries = 25, interval = 120): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const loop = () => {
      const value = predicate();
      if (value) {
        resolve(value);
        return;
      }
      if (++attempt >= retries) {
        reject(new Error("SDK load timeout"));
        return;
      }
      setTimeout(loop, interval);
    };
    loop();
  });
}

const normalizeStoreToken = (value: string) => {
  const asciiToken = value
    .replace(/https?:\/\/(www\.)?/, "")
    .replace(/[/?#].*$/, "")
    .replace(/[\[\]\(\)]/g, " ")
    .replace(/[|·<>*'"!?:;,.\-_/]+/g, " ")
    .toLowerCase()
    .trim();

  return asciiToken
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .map((part) => (STORE_KEY_STOP_WORD_SET.has(part) ? "" : part))
    .filter(Boolean)
    .join("");
};

const normalizeStoreKey = (campaign: Campaign) => {
  const brandFromTitle =
    campaign.title?.match(/^[\(\[\{]([^)\]\}]+)[\)\]\}]/)?.[1] || campaign.title?.match(/^([^-|·\s][^-|·]*)\s*[-–|]/)?.[1];
  const keys = [brandFromTitle, campaign.geo_store_key, campaign.shop_url, campaign.url, campaign.title, campaign.region_depth1, campaign.region_depth2]
    .filter(Boolean)
    .map((value) => normalizeStoreToken(String(value)))
    .filter((value) => value.length > 1);

  return keys.find((value) => value.length > 2) || `store-${Math.abs(((campaign.id as string).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 1000000)}`;
};

const coordBucket = (lat: number, lng: number) => {
  const latKey = Math.round(lat * 2500);
  const lngKey = Math.round(lng * 2500);
  return `${latKey}-${lngKey}`;
};

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

const MAP_GROUP_LIMIT = toPositiveInt(process.env.NEXT_PUBLIC_MAP_GROUP_LIMIT, 180);
const MAX_MERGE_RADIUS = toPositiveInt(process.env.NEXT_PUBLIC_MAP_MAX_MERGE_RADIUS, 600);
const DISTANCE_MERGE_RADIUS_M = toPositiveInt(process.env.NEXT_PUBLIC_MAP_MERGE_RADIUS_BASE, 300);

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

const blendCoordinate = (group: CampaignGroup, lat: number, lng: number, score: number) => {
  const campaignCount = Math.max(1, group.campaigns.length);
  const campaignWeight = Math.max(0.2, Math.min(1.2, score));
  const totalWeight = campaignCount + campaignWeight;

  return {
    lat: (group.lat * campaignCount + lat * campaignWeight) / totalWeight,
    lng: (group.lng * campaignCount + lng * campaignWeight) / totalWeight,
  };
};

const mergeRadiusMeters = (group: CampaignGroup, incomingScore: number) => {
  const sourceBase: Record<string, number> = {
    explicit: 100,
    url_coords: 170,
    region_center: 280,
    heuristic: 420,
  };

  const base = sourceBase[group.source] ?? 320;
  const uncertainty = Math.max(0, (1 - incomingScore) * 220);
  const sourceBoost = group.source === "explicit" ? 0 : group.source === "url_coords" ? 20 : group.source === "region_center" ? 70 : 140;
  const merged = base + uncertainty + sourceBoost;
  return Math.max(DISTANCE_MERGE_RADIUS_M * 0.6, Math.min(MAX_MERGE_RADIUS, merged));
};

const gradeColor = (grade: "높음" | "보통" | "낮음") => {
  if (grade === "높음") return "#16a34a";
  if (grade === "보통") return "#ca8a04";
  return "#64748b";
};

const createMapLabel = (group: CampaignGroup) => {
  const grade = matchGrade(group.score);
  const color = gradeColor(grade);
  const total = group.campaigns.length;
  const label = mapLabel(group);
  return `
    <div style="position:relative; min-width:48px; transform:translate(-50%, -100%);">
      <div style="background:${color}; color:#fff; border:2px solid #fff; border-radius:9999px; width:42px; height:42px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; box-shadow:0 8px 14px rgba(0,0,0,.25);">
        ${total}
      </div>
      <div style="position:absolute; left:50%; transform:translateX(-50%); top:40px; color:#334155; background:#fff; border-radius:8px; border:1px solid rgba(0,0,0,.1); padding:2px 8px; font-size:10px; white-space:nowrap;">
        ${label}
      </div>
    </div>
  `;
};

export function MapView({ campaigns }: { campaigns: Campaign[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapRefObj = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [engine, setEngine] = useState<MapEngine>("kakao");
  const [activeGroup, setActiveGroup] = useState<CampaignGroup | null>(null);
  const [loaded, setLoaded] = useState(false);

  const pinnedCampaigns = useMemo(() => {
    const grouped = new Map<string, CampaignGroup[]>();
    for (const campaign of campaigns || []) {
      const lat = parseCoord(campaign.lat);
      const lng = parseCoord(campaign.lng);
      if (!Number.isFinite(lat ?? NaN) || !Number.isFinite(lng ?? NaN) || (lat === 0 && lng === 0)) {
        continue;
      }

      const storeKey = normalizeStoreKey(campaign);
      const score = Number(campaign.geo_match_score ?? 0.2);
      const source = campaign.geo_match_source || "heuristic";
      const bucket = coordBucket(lat ?? 0, lng ?? 0);

      const bucketed = (grouped.get(storeKey) || []).slice();
      let targetGroup: CampaignGroup | null = null;

      for (const group of bucketed) {
        const radius = mergeRadiusMeters(group, score);
        if (group.key.startsWith(`${storeKey}-`) && distanceMeters(lat ?? 0, lng ?? 0, group.lat, group.lng) <= radius) {
          targetGroup = group;
          break;
        }
        if (group.key === `${storeKey}-${bucket}`) {
          targetGroup = group;
          break;
        }
      }

      if (!targetGroup) {
        const created: CampaignGroup = {
          key: `${storeKey}-${bucket}`,
          lat: lat ?? 0,
          lng: lng ?? 0,
          storeKey,
          source,
          score,
          campaigns: [campaign],
          representative: campaign,
        };
        bucketed.push(created);
        grouped.set(storeKey, bucketed);
        continue;
      }

      const blended = blendCoordinate(targetGroup, lat ?? 0, lng ?? 0, score);
      targetGroup.lat = blended.lat;
      targetGroup.lng = blended.lng;
      targetGroup.campaigns.push(campaign);
      if (score > targetGroup.score) {
        targetGroup.score = score;
        targetGroup.source = source;
        targetGroup.representative = campaign;
      }
      grouped.set(storeKey, bucketed);
    }

    const groups = Array.from(grouped.values()).flat();
    groups.sort((a, b) => b.campaigns.length - a.campaigns.length || b.score - a.score);
    return groups.slice(0, Math.max(1, MAP_GROUP_LIMIT));
  }, [campaigns]);

  useEffect(() => {
    if (!mapRef.current) return;

    const clearMap = () => {
      markersRef.current.forEach((m) => m?.setMap?.(null));
      markersRef.current = [];
      setActiveGroup(null);
      if (mapRef.current) mapRef.current.innerHTML = "";
      mapRefObj.current = null;
      setLoaded(false);
    };

    const renderKakaoMap = async () => {
      const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";
      const scriptId = "kakao-map-sdk";

      await new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(scriptId);
        if (existing) {
          waitFor(() => window.kakao?.maps).then(() => resolve()).catch(() => reject(new Error("Kakao maps load timeout")));
          return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services,clusterer`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Kakao map script."));
        document.head.appendChild(script);
      });

      if (!window.kakao?.maps) {
        if (typeof window.kakao?.maps?.load === "function") {
          await new Promise<void>((res) => window.kakao.maps.load(() => res()));
        } else {
          await waitFor(() => window.kakao?.maps, 20, 150).then(() => void 0).catch(() => {
            throw new Error("Kakao maps load timeout");
          });
        }
      }

      const { kakao } = window;
      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 8,
      });
      mapRefObj.current = map;

      const bounds = new kakao.maps.LatLngBounds();
      for (const group of pinnedCampaigns) {
        const container = document.createElement("div");
        container.innerHTML = createMapLabel(group).trim();
        const node = container.firstElementChild;
        const marker = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(group.lat, group.lng),
          map,
          content: node,
          xAnchor: 0.5,
          yAnchor: 1.0,
        });
        node?.addEventListener?.("click", () => {
          setActiveGroup(group);
          map.panTo(new kakao.maps.LatLng(group.lat, group.lng));
        });
        node?.addEventListener?.("touchstart", () => {
          setActiveGroup(group);
          map.panTo(new kakao.maps.LatLng(group.lat, group.lng));
        });
        markersRef.current.push(marker);
        bounds.extend(new kakao.maps.LatLng(group.lat, group.lng));
      }

      if (pinnedCampaigns.length > 0) {
        map.setBounds(bounds);
      }
      setLoaded(true);
    };

    const renderNaverMap = async () => {
      const NAVER_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";
      await new Promise<void>((resolve, reject) => {
        const id = "naver-map-sdk";
        const existed = document.getElementById(id);
        if (existed) {
          if (window.naver?.maps) resolve();
          else waitFor(() => window.naver?.maps).then(() => resolve()).catch(() => reject(new Error("Naver maps load timeout")));
          return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_ID}&submodules=geocoder`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Naver map script."));
        document.head.appendChild(script);
      });

      if (!window.naver?.maps) return;
      const { naver } = window;
      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(37.5665, 126.978),
        zoom: 8,
        zoomControl: true,
      });
      mapRefObj.current = map;

      const bounds = new naver.maps.LatLngBounds();
      pinnedCampaigns.forEach((group) => {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(group.lat, group.lng),
          map,
          title: `${group.representative.title || "캠페인"} (${group.campaigns.length})`,
          icon: {
            content: createMapLabel(group),
            anchor: new naver.maps.Point(21, 44),
          },
        });
        naver.maps.Event.addListener(marker, "click", () => setActiveGroup(group));
        markersRef.current.push(marker);
        bounds.extend(new naver.maps.LatLng(group.lat, group.lng));
      });

      if (pinnedCampaigns.length > 0) {
        map.fitBounds(bounds);
      }
      setLoaded(true);
    };

    const render = async () => {
      clearMap();
      try {
        if (engine === "kakao") {
          await renderKakaoMap();
        } else {
          await renderNaverMap();
        }
      } catch {
        if (engine === "kakao") {
          setEngine("naver");
        } else {
          setLoaded(false);
        }
      }
    };

    render();

    return () => {
      clearMap();
    };
  }, [engine, pinnedCampaigns]);

  const count = pinnedCampaigns.length;
  const activeCampaign = activeGroup?.representative;

  return (
    <section className="relative h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 dark:bg-slate-950">
      <div className="absolute top-4 left-4 z-10 flex gap-2 rounded-2xl bg-white/95 p-2 shadow">
        <button onClick={() => setEngine("kakao")} className={`rounded-xl px-3 py-1.5 text-xs font-black ${engine === "kakao" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          카카오맵
        </button>
        <button onClick={() => setEngine("naver")} className={`rounded-xl px-3 py-1.5 text-xs font-black ${engine === "naver" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
          네이버지도
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 rounded-xl bg-white/95 px-4 py-2 text-xs font-black shadow">
        총 {count}개 매장
      </div>

      {count === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 text-white">
          <p className="rounded-xl bg-black/30 px-5 py-3 text-sm">유효한 좌표가 있는 캠페인이 없습니다.</p>
        </div>
      )}

      {!loaded && count > 0 ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/80">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-6 py-4 text-xs font-black text-slate-500 shadow">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            지도 로딩 중...
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/95 px-4 py-2 text-xs font-black text-slate-500 shadow">
        {engine === "kakao" ? "카카오맵 모드" : "네이버지도 모드"}
      </div>

      <button
        onClick={() => {
          if (!mapRefObj.current || !navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            if (engine === "kakao" && window.kakao?.maps) {
              mapRefObj.current.panTo(new window.kakao.maps.LatLng(lat, lng));
            } else if (engine === "naver" && window.naver?.maps) {
              mapRefObj.current.setCenter(new window.naver.maps.LatLng(lat, lng));
            }
          });
        }}
        className="absolute top-16 right-4 z-10 rounded-xl bg-white/95 p-3 shadow"
      >
        <Compass className="h-4 w-4" />
      </button>

      <div className="h-full w-full" ref={mapRef} />

      <AnimatePresence>
        {activeCampaign ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border bg-white/95 p-4 shadow-xl"
          >
            <button onClick={() => setActiveGroup(null)} className="absolute right-3 top-3 text-slate-400">
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3">
              <img
                src={activeCampaign.thumbnail_url || "https://via.placeholder.com/140"}
                alt={activeCampaign.title || "캠페인 썸네일"}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="flex-1 text-sm">
                <p className="font-black text-slate-900">{activeCampaign.title}</p>
                <p className="text-xs text-slate-500">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {toDisplayLocation(activeGroup!)}
                </p>
                <p className="text-xs text-slate-500">유형: {TYPE_LABEL[activeCampaign.campaign_type || "ETC"] || "기타"}</p>
                <p className="text-xs text-slate-500">매칭: {mapLabel(activeGroup!)}</p>
                <p className="text-xs text-slate-500">캠페인 수: {activeGroup?.campaigns.length || 1}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Link href={`/campaigns/${activeCampaign.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">
                    상세보기
                  </Link>
                  <a href={activeCampaign.url || "#"} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700">
                    원문 이동
                  </a>
                    {activeCampaign.shop_url ? (
                    <a href={activeCampaign.shop_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700">
                      매장 링크
                    </a>
                  ) : null}
                </div>
                {activeGroup && activeGroup.campaigns.length > 1 ? (
                  <ul className="mt-2 text-[11px] text-slate-500 list-disc pl-4">
                    {activeGroup.campaigns.slice(0, 3).map((item) => (
                      <li key={item.id}>{item.title || "제목 없음"}</li>
                    ))}
                    {activeGroup.campaigns.length > 3 ? <li>...외 {activeGroup.campaigns.length - 3}개 더</li> : null}
                  </ul>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default MapView;
