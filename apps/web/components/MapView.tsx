"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Coordinates for Seoul Districts
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "강남": [37.4979, 127.0276], "서초": [37.4836, 127.0327], "송파": [37.5145, 127.1058],
  "마포": [37.5501, 126.9144], "종로": [37.5729, 126.9792], "성수": [37.5446, 127.0559],
  "용산": [37.5326, 126.9908], "홍대": [37.5567, 126.9235], "신촌": [37.5551, 126.9369],
  "이태원": [37.5345, 126.9942], "건대": [37.5408, 127.0706], "합정": [37.5484, 126.9123],
  "여의도": [37.5216, 126.9242], "강동": [37.5301, 127.1238], "노원": [37.6542, 127.0563],
  "은평": [37.6027, 126.9291], "성북": [37.5894, 127.0167], "도봉": [37.6688, 127.0471],
};

const TYPE_COLOR: Record<string, string> = {
  VST: "#3b82f6",
  SHP: "#10b981",
  PRS: "#f59e0b",
};

export default function MapView({ campaigns }: { campaigns: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  // Filter campaigns with location data
  const pinnedCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (!c.location) return false;
      return Object.keys(DISTRICT_COORDS).some(d => c.location.includes(d));
    }).slice(0, 50); // Limit for performance
  }, [campaigns]);

  useEffect(() => {
    // Dynamically load Leaflet from CDN to avoid build-time issues
    if (typeof window === "undefined" || mapLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!mapRef.current) return;

      // @ts-expect-error - leaflet is loaded from CDN at runtime
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [37.54, 126.99], // Center of Seoul
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // Premium Dark Carto DB Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add Pins
      pinnedCampaigns.forEach((c, idx) => {
        const district = Object.keys(DISTRICT_COORDS).find(d => c.location.includes(d));
        if (!district) return;

        const coords = DISTRICT_COORDS[district];
        // Randomized jitter
        const lat = coords[0] + (Math.random() - 0.5) * 0.015;
        const lng = coords[1] + (Math.random() - 0.5) * 0.015;

        const color = TYPE_COLOR[c.campaign_type] ?? "#475569";

        const html = `
          <div class="relative group">
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all hover:scale-125" style="background: ${color}">
              <span class="text-[14px]">${c.campaign_type === 'VST' ? '🍽️' : c.campaign_type === 'SHP' ? '📦' : '📰'}</span>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style="background: ${color}"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-pin',
          html,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        marker.on('click', () => {
          setActiveCampaign(c);
        });
      });

      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, [pinnedCampaigns]);

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
