"use client";

import { MapPin, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function MapView({ campaigns }: { campaigns: any[] }) {
    // This is a professional mockup of a map view since real map integration (Kakao/Google) 
    // requires API keys usually injected at the global layout level.

    const campaignsWithLocation = campaigns.filter(c => c.location && c.location !== "전국" && c.location !== "재택");

    return (
        <div className="w-full h-[600px] rounded-[2.5rem] bg-slate-50 border border-slate-200 overflow-hidden relative shadow-inner">
            {/* Fake Map Background */}
            <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000')] bg-cover bg-center" />

            {/* Map UI Overlays */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]">
                    <h3 className="text-xs font-black text-slate-900 mb-1">지도 기반 탐색</h3>
                    <p className="text-[10px] text-slate-500 leading-normal">현재 화면에 표시된 지역 기반 체험단입니다.</p>
                </div>
                <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-700">실시간 위치 동기화 중</span>
                </div>
            </div>

            {/* Mock Pins */}
            <div className="absolute inset-0 pointer-events-none">
                {campaignsWithLocation.length > 0 ? (
                    campaignsWithLocation.slice(0, 12).map((c, idx) => (
                        <motion.div
                            key={`pin-${c.id}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="absolute pointer-events-auto cursor-pointer group"
                            style={{
                                top: `${20 + (Math.random() * 60)}%`,
                                left: `${20 + (Math.random() * 60)}%`
                            }}
                        >
                            <div className="relative">
                                <MapPin className="w-8 h-8 text-blue-600 drop-shadow-lg group-hover:scale-125 transition-transform" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-2xl z-50">
                                    {c.title}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-3">
                        <Info className="w-12 h-12" />
                        <p className="text-sm font-bold">표시할 지역 기반 데이터가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50">+</button>
                <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50">-</button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 z-10 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl text-white text-[10px] font-bold border border-white/10 flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" />방문형</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" />기타</div>
            </div>
        </div>
    );
}
