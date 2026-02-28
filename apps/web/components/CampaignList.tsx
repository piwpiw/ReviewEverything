"use client";

import { useEffect, useState, useTransition } from "react";
import CampaignCard from "./CampaignCard";
import MapView from "./MapView";
import ListSkeleton from "./ListSkeleton";
import { Grid3X3, Map as MapIcon, Ghost, Sparkles, FilterX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CampaignList({ searchParams, viewMode }: { searchParams: any; viewMode: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const sp = new URLSearchParams(searchParams);
            try {
                const res = await fetch(`/api/campaigns?${sp.toString()}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [searchParams]);

    if (loading && !data) return <ListSkeleton />;

    const campaigns = data?.campaigns || [];
    const total = data?.total || 0;

    if (campaigns.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-slate-100 shadow-sm"
            >
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 relative">
                    <FilterX className="w-10 h-10 text-slate-300" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                        <span className="text-xs font-black">0</span>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">일치하는 캠페인이 없습니다</h3>
                <p className="text-slate-400 font-bold mb-10 max-w-md text-center leading-relaxed">
                    지정한 필터(지역, 경쟁률, 제안금액)에 해당하는 캠페인을 찾지 못했습니다.<br />
                    필터를 조정하거나 초기화 해보세요.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[13px] font-black hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                >
                    <Ghost className="w-5 h-5" /> 모든 필터 초기화하기
                </button>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* List Analysis Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-lg">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                        Total <span className="text-blue-600 font-black px-1.5 py-0.5 bg-blue-50 rounded-lg ml-1">{total.toLocaleString()}</span> Campaigns Identified
                    </p>
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
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6"
                    >
                        {campaigns.map((c: any, i: number) => (
                            <CampaignCard key={c.id} campaign={c} rank={searchParams.sort === 'applicant_desc' ? i + 1 : undefined} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination Placeholder High-End */}
            <div className="mt-20 flex justify-center pb-20">
                <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl">
                    {[1, 2, 3, 4, 5].map(p => (
                        <button key={p} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${p === 1 ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                            {p}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-100 mx-2" />
                    <button className="px-6 py-2 text-xs font-black text-slate-900 hover:text-blue-600 transition-colors">Next Page &rarr;</button>
                </div>
            </div>
        </div>
    );
}
