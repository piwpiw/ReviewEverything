"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Share, ArrowUp, PlusSquare, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAPrompt() {
    const [show, setShow] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);

    useEffect(() => {
        // 1. Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // 2. Identify platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        // 3. Show after a short delay if mobile
        if (isIos || isAndroid) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPlatform(isIos ? 'ios' : 'android');
            const dismissed = localStorage.getItem("pwa_prompt_dismissed");
            if (!dismissed) {
                const timer = setTimeout(() => setShow(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem("pwa_prompt_dismissed", "true");
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-[200] max-w-md mx-auto"
                >
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors duration-[2s]" />

                        <button
                            onClick={dismiss}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex gap-6 items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl relative shrink-0">
                                {/* App Logo Like Icon */}
                                <LayoutGrid className="w-8 h-8 text-white" />
                                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">APP</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-black tracking-tight leading-none mb-1">체험단 모아 앱 설치</h3>
                                <p className="text-xs text-slate-400 font-bold leading-relaxed">홈 화면에 추가하고 <span className="text-blue-400">1초 만에</span> 모든 체험단을 통합 검색하세요!</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                                {platform === 'ios' ? (
                                    <>
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <Share className="w-5 h-5 text-blue-400" />
                                            <span className="text-[10px] font-black text-slate-500">1. 공유</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <PlusSquare className="w-5 h-5 text-blue-400" />
                                            <span className="text-[10px] font-black text-slate-500">2. 추가</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-300">사파리 하단 <span className="text-white font-black">[공유]</span> 버튼 누르고 <span className="text-white font-black">[홈 화면에 추가]</span>를 선택하세요.</p>
                                    </>
                                ) : (
                                    <>
                                        <Smartphone className="w-6 h-6 text-blue-400 shrink-0" />
                                        <p className="text-[11px] font-bold text-slate-300">브라우저 메뉴에서 <span className="text-white font-black">[홈 화면에 추가]</span> 또는 <span className="text-white font-black">[앱 설치]</span>를 누르세요.</p>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={dismiss}
                                className="w-full py-4 bg-white text-slate-900 rounded-2xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
                            >
                                나중에 할게요
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
