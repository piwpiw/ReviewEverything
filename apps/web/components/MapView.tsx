"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, Compass, Globe, Zap, X } from "lucide-react";

// Types for Global Windows
declare global {
  interface Window {
    kakao: any;
    naver: any;
  }
}

const TYPE_COLOR: Record<string, string> = {
  VST: "#3b82f6",
  SHP: "#10b981",
  PRS: "#f59e0b",
};

type MapEngine = "kakao" | "naver";

export default function MapView({ campaigns }: { campaigns: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [engine, setEngine] = useState<MapEngine>("kakao");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("탐색 중...");

  // Filter campaigns with location data
  const pinnedCampaigns = useMemo(() => {
    return (campaigns || []).filter(c => c.lat && c.lng).slice(0, 100);
  }, [campaigns]);

  // Handle Script Loading & Map Init
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cleanup previous map instance if switch
    if (mapInstance.current) {
      mapInstance.current = null;
      if (mapRef.current) mapRef.current.innerHTML = "";
    }

    const loadKakao = () => {
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "3d5f7ad7a080c5ea3f9b1f632f6ecadb";
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=clusterer`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          if (!mapRef.current) return;
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(37.5665, 126.978),
            level: 8,
            maxLevel: 13
          });
          mapInstance.current = map;

          // Add Markers
          pinnedCampaigns.forEach((c) => {
            const color = TYPE_COLOR[c.campaign_type] ?? "#475569";
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="kakao-pin" style="position: relative; cursor: pointer;">
                  <div style="position: absolute; width: 34px; height: 34px; background: ${color}20; border-radius: 50%; top: -17px; left: -17px; animation: pulse 2s infinite;"></div>
                  <div style="background: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg) translate(0, -50%); border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px rgba(0,0,0,0.2);">
                    <span style="transform: rotate(45deg); font-size: 14px; margin-top: -2px; margin-left: -2px;">
                      ${c.campaign_type === 'VST' ? '🍽️' : c.campaign_type === 'SHP' ? '📦' : '📰'}
                    </span>
                  </div>
                </div>
              `;
            const overlay = new window.kakao.maps.CustomOverlay({
              position: new window.kakao.maps.LatLng(c.lat, c.lng),
              content,
              yAnchor: 1
            });
            content.onclick = (e) => { e.stopPropagation(); setActiveCampaign(c); map.panTo(new window.kakao.maps.LatLng(c.lat, c.lng)); };
            overlay.setMap(map);
          });

          window.kakao.maps.event.addListener(map, 'dragend', () => setShowSearchBtn(true));
          setIsLoaded(true);
        });
      };
      document.head.appendChild(script);
    };

    const loadNaver = () => {
      let NAVER_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "xqc9tm6yw6";
      if (NAVER_ID === "your_naver_client_id_here") NAVER_ID = "xqc9tm6yw6"; // Next.js Env 캐시 방어

      const initNaverMap = () => {
        if (!mapRef.current || !window.naver || !window.naver.maps) return;

        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(37.5665, 126.978),
          zoom: 14,
          zoomControl: true,
          zoomControlOptions: { position: window.naver.maps.Position.TOP_LEFT }
        });
        mapInstance.current = map;

        const markers = pinnedCampaigns.map((c) => {
          const color = TYPE_COLOR[c.campaign_type] ?? "#475569";
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(c.lat, c.lng),
            map: map,
            icon: {
              content: `
                <div style="position: relative; cursor: pointer;">
                  <div style="position: absolute; width: 34px; height: 34px; background: ${color}20; border-radius: 50%; top: -17px; left: -17px; animation: pulse 2s infinite;"></div>
                  <div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px rgba(0,0,0,0.2);">
                    <span style="font-size: 14px;">${c.campaign_type === 'VST' ? '🍽️' : c.campaign_type === 'SHP' ? '📦' : '📰'}</span>
                  </div>
                </div>
              `,
              anchor: new window.naver.maps.Point(16, 16)
            }
          });

          window.naver.maps.Event.addListener(marker, 'click', () => {
            setActiveCampaign(c);
            map.panTo(new window.naver.maps.LatLng(c.lat, c.lng));
          });
          return marker;
        });

        if (!document.getElementById("naver-cluster-script")) {
          const clusterScript = document.createElement("script");
          clusterScript.id = "naver-cluster-script";
          clusterScript.src = "https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js";
          clusterScript.onload = () => {
            if (window.naver && (window as any).MarkerClustering) {
              new (window as any).MarkerClustering({
                minClusterSize: 2, maxZoom: 13, map: map, markers: markers,
                disableClickZoom: false, gridSize: 100,
                icons: [{
                  content: `<div style="cursor:pointer;width:50px;height:50px;line-height:52px;font-size:14px;color:white;text-align:center;font-weight:900;background:rgba(16, 185, 129, 0.9);border-radius:25px;border:3px solid rgba(255,255,255,0.3);box-shadow:0 10px 20px rgba(0,0,0,0.2);"></div>`,
                  size: new window.naver.maps.Size(50, 50),
                  anchor: new window.naver.maps.Point(25, 25)
                }],
                indexGenerator: [10, 100, 200, 500, 1000],
                stylingFunction: (clusterMarker: any, count: number) => {
                  clusterMarker.getElement().querySelector('div').textContent = count;
                }
              });
            }
          };
          document.head.appendChild(clusterScript);
        }

        window.naver.maps.Event.addListener(map, 'dragend', () => {
          setShowSearchBtn(true);
          const center = map.getCenter();
          updateAddress(center.lat(), center.lng());
        });
        setIsLoaded(true);
      };

      if (window.naver && window.naver.maps) {
        initNaverMap();
        return;
      }

      const scriptId = "naver-map-script-v3";
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_ID}&submodules=geocoder`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", initNaverMap);
    };

    if (engine === "kakao") loadKakao();
    else loadNaver();

    // Reverse Geocoding Helper for Naver
    const updateAddress = (lat: number, lng: number) => {
      if (engine === 'naver' && window.naver && window.naver.maps.Service) {
        window.naver.maps.Service.reverseGeocode({
          coords: new window.naver.maps.LatLng(lat, lng),
          orders: [
            window.naver.maps.Service.OrderType.ADDR,
            window.naver.maps.Service.OrderType.ROAD_ADDR
          ].join(',')
        }, (status: any, response: any) => {
          if (status === window.naver.maps.Service.Status.OK) {
            const addr = response.v2.address.jibunAddress || response.v2.address.roadAddress;
            setCurrentAddress(addr.split(' ').slice(0, 3).join(' '));
          }
        });
      }
    };

    // Pulse animation style
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.95); opacity: 0.7; }
        70% { transform: scale(1.5); opacity: 0; }
        100% { transform: scale(0.95); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }, [engine, pinnedCampaigns]);

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl h-[700px] font-['Inter']">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 tracking-widest uppercase">
              {engine === "kakao" ? "카카오맵" : "네이버맵"} 지도 로딩 중...
            </p>
          </div>
        </div>
      )}

      {/* Map Content */}
      <div key={`${engine}-${pinnedCampaigns.length}`} ref={mapRef} className="w-full h-full z-0" />

      {/* Engine Switcher (Premium UI) */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-3">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/20 shadow-2xl flex gap-1">
          <button
            onClick={() => setEngine("kakao")}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black transition-all ${engine === "kakao" ? "bg-amber-400 text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
          >
            카카오맵
          </button>
          <button
            onClick={() => setEngine("naver")}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black transition-all ${engine === "naver" ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
          >
            네이버맵
          </button>
        </div>

        <div className={`px-4 py-2.5 rounded-2xl text-[10px] font-black backdrop-blur-md shadow-2xl flex items-center gap-3 border border-white/10 ${engine === 'kakao' ? 'bg-slate-900/90 text-white' : 'bg-emerald-600/90 text-white'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${engine === 'kakao' ? 'bg-amber-400' : 'bg-white'}`} />
          현재 {engine === "kakao" ? "카카오맵" : "네이버맵"} 엔진 사용
        </div>

        {/* My Location Button */}
        <button
          onClick={() => {
            if (mapInstance.current && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                if (engine === "kakao") {
                  mapInstance.current.panTo(new window.kakao.maps.LatLng(lat, lng));
                } else {
                  mapInstance.current.panTo(new window.naver.maps.LatLng(lat, lng));
                }
              });
            }
          }}
          className="p-3.5 bg-white dark:bg-slate-800 rounded-2.5xl shadow-2xl border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all text-slate-900 dark:text-white"
        >
          <Compass className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Floating: Search in this area */}
      <AnimatePresence>
        {showSearchBtn && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setShowSearchBtn(false)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[11px] font-black shadow-2xl border border-white/20 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-blue-400" />
              이 지역에서 다시 조회
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Overlay Status */}
      <div className="absolute top-6 left-6 z-10 hidden md:block">
        <div className="glass-card bg-white/70 dark:bg-slate-900/80 rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-slate-700/50">
          <h3 className="text-xs font-black text-slate-900 dark:text-white mb-4 tracking-widest uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> 지도 레이어 제어
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-slate-500 uppercase">현재 지역</span>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter truncate max-w-[120px]">{currentAddress}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-slate-500 uppercase">표시 캠페인</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{pinnedCampaigns.length}개</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> 방문형 캠페인
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> 배송형 캠페인
            </div>
          </div>
        </div>
      </div>

      {/* Floating Detail Card */}
      <AnimatePresence>
        {activeCampaign && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[360px] glass-card bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] p-6 shadow-2xl border border-white dark:border-slate-700">
            <button
              onClick={() => setActiveCampaign(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-5">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                <img src={activeCampaign.thumbnail_url || 'https://via.placeholder.com/150'} className="object-cover w-full h-full" alt="" />
              </div>
              <div className="flex flex-col justify-center gap-1.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">{activeCampaign.platform?.name}</span>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  {activeCampaign.campaign_type === "VST" ? "방문형" : activeCampaign.campaign_type === "SHP" ? "배송형" : "기타"}
                </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-tight">{activeCampaign.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><MapIcon className="w-3 h-3" /> {activeCampaign.location}</p>
                <Link href={`/campaigns/${activeCampaign.id}`} className="mt-3 text-[10px] font-black text-white bg-slate-900 dark:bg-blue-600 px-5 py-2.5 rounded-2xl text-center hover:shadow-xl transition-all shadow-md">
                  자세히 보기 &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
