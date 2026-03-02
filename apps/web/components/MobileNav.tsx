"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, Flame, User, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { label: "홈", href: "/", icon: Home },
  { label: "트렌드", href: "/trending", icon: Flame },
  { label: "지도", href: "/?campaign_type=VST&view=map", icon: MapIcon },
  { label: "캘린더", href: "/me?userId=1", icon: CalendarDays },
  { label: "내정보", href: "/me", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[150]">
      <nav className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex items-center justify-around shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center gap-1 p-3 transition-all active:scale-95"
            >
              <div className={`relative z-10 transition-colors duration-300 ${isActive ? "text-blue-400" : "text-slate-500"}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black tracking-tighter transition-colors duration-300 ${isActive ? "text-white" : "text-slate-500"}`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 bg-white/5 rounded-2xl -z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
