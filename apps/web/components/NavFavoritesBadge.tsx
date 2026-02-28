"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import { motion, AnimatePresence } from "framer-motion";

export default function NavFavoritesBadge() {
    const { favorites } = useFavorites();
    const count = favorites.length;

    return (
        <Link href="/?show_favorites=true" className="relative group p-2 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-5 h-5 text-slate-500 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>

            <AnimatePresence>
                {count > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-md shadow-rose-500/30"
                    >
                        {count}
                    </motion.span>
                )}
            </AnimatePresence>
        </Link>
    );
}
