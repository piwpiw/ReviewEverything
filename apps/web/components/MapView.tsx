"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Seoul district coordinates for placing pins
const DISTRICT_COORDS: Record<string, { x: number; y: number }> = {
  "강남": { x: 60, y: 62 }, "서초": { x: 53, y: 68 }, "송파": { x: 70, y: 60 },
  "마포": { x: 34, y: 38 }, "종로": { x: 47, y: 33 }, "성수": { x: 62, y: 38 },
  "용산": { x: 44, y: 48 }, "홍대": { x: 32, y: 38 }, "신촌": { x: 34, y: 40 },
  "이태원": { x: 44, y: 52 }, "건대": { x: 64, y: 40 }, "합정": { x: 33, y: 42 },
  "여의도": { x: 30, y: 56 }, "강동": { x: 76, y: 48 }, "노원": { x: 59, y: 20 },
  "은평": { x: 28, y: 25 }, "성북": { x: 50, y: 25 }, "도봉": { x: 50, y: 14 },
};

function seededJitter(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return ((hash % 11) - 5) / 2;
}

function getCoords(location: string | null): { x: number; y: number } | null {
  if (!location) return null;
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    if (location.includes(district)) return coords;
  }
  // Random placement for non-Seoul
  return null;
}

const TYPE_COLOR: Record<string, string> = {
  VST: "#3b82f6",
  SHP: "#10b981",
  PRS: "#f59e0b",
};

export default function MapView({ campaigns }: { campaigns: any[] }) {
  const pinned = useMemo(() => {
    const result: Array<{ campaign: any; x: number; y: number }> = [];
    const placed = new Set<string>();

    for (const c of campaigns) {
      const coords = getCoords(c.location);
      if (!coords) continue;
      // Slight jitter to avoid stacking
      const jx = coords.x + seededJitter(String(c.id ?? c.title ?? "n"));
      const jy = coords.y + seededJitter(String(c.location ?? c.id ?? "n"));
      const key = `${Math.round(jx)}-${Math.round(jy)}`;
      if (!placed.has(key)) {
        placed.add(key);
        result.push({ campaign: c, x: jx, y: jy });
      }
    }
    return result;
  }, [campaigns]);

  const typeStats = useMemo(() => {
    const vst = campaigns.filter(c => c.campaign_type === "VST").length;
    const shp = campaigns.filter(c => c.campaign_type === "SHP").length;
    const prs = campaigns.filter(c => c.campaign_type === "PRS").length;
    return { vst, shp, prs };
  }, [campaigns]);

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-200 shadow-xl" style={{ height: 640 }}>
      {/* Map background image */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50" />
        {/* Seoul district lines shown as SVG overlay */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[20, 30, 40, 50, 60, 70, 80].map(v => (
            <line key={`h${v}`} x1="0" y1={v} x2="100" y2={v} stroke="#e2e8f0" strokeWidth="0.3" />
          ))}
          {[20, 30, 40, 50, 60, 70, 80].map(v => (
            <line key={`v${v}`} x1={v} y1="0" x2={v} y2="100" stroke="#e2e8f0" strokeWidth="0.3" />
          ))}
          {/* Han River */}
          <path d="M15,52 Q30,50 50,48 Q70,48 85,50" stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>

      {/* Campaign Pins */}
      {pinned.map(({ campaign, x, y }, i) => {
        const color = TYPE_COLOR[campaign.campaign_type] ?? "#64748b";
        const snap = campaign.snapshots?.[0];
        const compRate = snap?.competition_rate ? Number(snap.competition_rate).toFixed(1) : "0";
        return (
          <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
              className="absolute group cursor-pointer z-10"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -100%)" }}
            >
              {/* Pop-up tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[180px] bg-white rounded-xl shadow-2xl border border-slate-100 p-2.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 scale-95 group-hover:scale-100">
                <div className="font-bold text-[11px] text-slate-900 line-clamp-2 mb-1">{campaign.title}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{campaign.platform?.name}</span>
                  <span className="text-[10px] font-black text-rose-500">경쟁 {compRate}:1</span>
                </div>
                {campaign.reward_text && (
                  <div className="mt-1 text-[10px] font-bold text-blue-600 truncate">🎁 {campaign.reward_text}</div>
                )}
              </div>

              {/* Pin shape */}
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center group-hover:scale-125 transition-transform"
                style={{ background: color }}
              >
                <span className="text-[9px] font-black text-white">
                  {campaign.campaign_type === "VST" ? "🍽" : campaign.campaign_type === "SHP" ? "📦" : "📰"}
                </span>
              </div>
              {/* Pin tail */}
              <div className="w-1.5 h-2.5 mx-auto -mt-px rounded-b-full" style={{ background: color }} />
            </motion.div>
          </Link>
        );
      })}

      {/* Empty state */}
      {pinned.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-slate-400">
          <div className="text-5xl">🗺️</div>
          <p className="font-bold text-sm">표시할 지역 기반 데이터가 없습니다</p>
          <p className="text-xs">방문형 체험단 필터를 선택해보세요</p>
        </div>
      )}

      {/* Stats overlay - top left */}
      <div className="absolute top-4 left-4 z-20 glass-card rounded-2xl px-4 py-3 shadow-xl space-y-1">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">서울 지역 매핑</div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-slate-700">방문형 {typeStats.vst}건</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-700">배송형 {typeStats.shp}건</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-700">기자단 {typeStats.prs}건</span>
        </div>
        <div className="border-t border-slate-100 pt-1 text-[9px] text-slate-400">
          지도 위 핀을 클릭하세요
        </div>
      </div>

      {/* District labels */}
      {Object.entries(DISTRICT_COORDS).map(([name, { x, y }]) => (
        <div
          key={name}
          className="absolute text-[9px] font-bold text-slate-400 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
        >
          {name}
        </div>
      ))}

      {/* Han River label */}
      <div className="absolute text-[9px] font-bold text-blue-400/60 pointer-events-none" style={{ left: "48%", top: "50%" }}>
        한강
      </div>

      {/* Pin count badge */}
      {pinned.length > 0 && (
        <div className="absolute top-4 right-4 z-20 glass-card rounded-xl px-3 py-2 shadow-lg">
          <span className="text-[11px] font-black text-slate-700">📍 {pinned.length}개 표시 중</span>
        </div>
      )}
    </div>
  );
}
