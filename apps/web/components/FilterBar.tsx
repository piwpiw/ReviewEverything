"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, MousePointer2, Share2, Loader2 } from "lucide-react";

const PLATFORMS = [
    { id: "", label: "전체 플랫폼" },
    { id: "1", label: "레뷰(Revu)" },
    { id: "2", label: "리뷰노트" },
    { id: "3", label: "디너의여왕" },
    { id: "4", label: "리뷰플레이스" },
    { id: "5", label: "서울오빠" },
    { id: "6", label: "미스터블로그" },
    { id: "7", label: "강남맛집" },
];

const TYPES = [
    { id: "", label: "전체 유형" },
    { id: "VST", label: "방문형" },
    { id: "SHP", label: "배송형" },
    { id: "PRS", label: "기자단" },
];

const MEDIA = [
    { id: "", label: "전체 매체" },
    { id: "BP", label: "블로그" },
    { id: "IP", label: "인스타그램" },
    { id: "YP", label: "유튜브" },
];

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentPlatform = searchParams.get("platform_id") || "";
    const currentType = searchParams.get("campaign_type") || "";
    const currentMedia = searchParams.get("media_type") || "";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) params.set(name, value);
            else params.delete(name);
            return params.toString();
        },
        [searchParams]
    );

    const handleSelect = (name: string, value: string) => {
        startTransition(() => {
            router.push("?" + createQueryString(name, value), { scroll: false });
        });
    };

    const Section = ({ title, items, current, name, icon: Icon }: any) => (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 px-1">
                <Icon className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item: any) => {
                    const isActive = current === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(name, item.id)}
                            className={`relative px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 border ${isActive
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02] z-10'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-900'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={`${name}-active`}
                                    className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                                />
                            )}
                            {item.label}
                        </button>
                    )
                })}
            </div>
        </div>
    );

    return (
        <div className="w-full glass-card p-6 rounded-[2rem] shadow-xl shadow-slate-900/5 mb-8 flex flex-col gap-6 border border-white/50 premium-blur">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                <Section title="Platforms" items={PLATFORMS} current={currentPlatform} name="platform_id" icon={Layers} />
                <Section title="Campaign Types" items={TYPES} current={currentType} name="campaign_type" icon={MousePointer2} />
                <Section title="Social Media" items={MEDIA} current={currentMedia} name="media_type" icon={Share2} />
            </div>

            <AnimatePresence>
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 justify-center text-blue-600 font-bold text-[10px] bg-blue-50/50 py-2 rounded-xl border border-blue-100/50"
                    >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        데이터를 불러오는 중입니다...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
