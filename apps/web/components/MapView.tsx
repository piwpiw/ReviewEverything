"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_COLOR: Record<string, string> = {
  VST: "#3b82f6",
  SHP: "#10b981",
  PRS: "#f59e0b",
};

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapView({ campaigns }: { campaigns: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  // Filter campaigns with location data
  const pinnedCampaigns = useMemo(() => {
    return campaigns.filter(c => c.lat && c.lng).slice(0, 100);
  }, [campaigns]);

  useEffect(() => {
    if (typeof window === "undefined" || mapLoaded) return;

    const script = document.createElement("script");
    // Using a sample app key for UI demonstration - in production user should provide their own
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=7019688755601d528b36873966579301&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 8
        };

        const map = new window.kakao.maps.Map(mapRef.current, options);

        pinnedCampaigns.forEach((c) => {
          const color = TYPE_COLOR[c.campaign_type] ?? "#475569";
          const content = `
            <div class="kakao-pin" style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; items-center; justify-center; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer;">
              <span style="font-size: 10px;">${c.campaign_type === 'VST' ? '🍽️' : c.campaign_type === 'SHP' ? '📦' : '📰'}</span>
            </div>
          `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(c.lat, c.lng),
            content: content,
            yAnchor: 1
          });

          customOverlay.setMap(map);
          
          // Note: Event handling for CustomOverlay requires adding events to the DOM element directly
          // For now, focusing on visual integration
        });

        setMapLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, [pinnedCampaigns, mapLoaded]);

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-2xl h-[700px]">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-400">지도를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* Real Map Container */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Overlays */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
        <div className="glass-card rounded-2xl p-5 shadow-2xl border border-white/60">
          <h3 className="text-xs font-black text-slate-900 mb-4 tracking-tight uppercase">Live Activity Map</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
              <span className="text-[11px] font-bold text-slate-600">방문형 캠페인</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              <span className="text-[11px] font-bold text-slate-600">배송형 캠페인</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              <span className="text-[11px] font-bold text-slate-600">기자단 캠페인</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-blue-600">현재 서울 전역 {pinnedCampaigns.length}개 실시간</p>
          </div>
        </div>
      </div>

      {/* Floating Campaign Card on Click */}
      <AnimatePresence>
        {activeCampaign && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[340px] glass-card rounded-3xl p-5 shadow-2xl border border-white/80"
          >
            <button
              onClick={() => setActiveCampaign(null)}
              className="absolute top-3 right-3 w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
              ×
            </button>
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                <img
                  src={activeCampaign.thumbnail_url || 'https://via.placeholder.com/150'}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col justify-center gap-1 overflow-hidden">
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit">
                  {activeCampaign.platform?.name}
                </span>
                <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">
                  {activeCampaign.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold truncate">📍 {activeCampaign.location}</p>
                <Link
                  href={`/campaigns/${activeCampaign.id}`}
                  className="mt-2 text-[10px] font-black text-white bg-slate-900 px-4 py-2 rounded-xl text-center hover:bg-blue-600 transition-all shadow-md"
                >
                  상세보기 &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-6 right-6 z-10">
        <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl text-[10px] font-black backdrop-blur-md shadow-2xl flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          REAL-TIME ENGINE ACTIVE
        </div>
      </div>
    </div>
  );
}
