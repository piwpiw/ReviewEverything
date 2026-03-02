"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Flame, Home, LayoutDashboard, Map as MapIcon, Settings2, ShieldCheck, UserCheck } from "lucide-react";
import { useMemo } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mapHref = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("view", "map");
    const query = params.toString();
    return query ? `/?${query}` : "/map";
  }, [searchParams]);

  const isMapView = searchParams?.get("view") === "map";
  const navItems = [
    { label: "홈", href: "/", icon: Home },
    { label: "지도", href: mapHref, icon: MapIcon },
    { label: "트렌드", href: "/trending", icon: Flame },
    { label: "운영", href: "/admin", icon: Settings2 },
    { label: "시스템", href: "/system", icon: ShieldCheck },
    { label: "내 활동", href: "/me", icon: LayoutDashboard },
    { label: "캘린더", href: "/me/calendar", icon: UserCheck },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === mapHref || href === "/map") return pathname === "/map" || (pathname === "/" && isMapView);
    if (href === "/admin") return pathname.startsWith("/admin");
    if (href.startsWith("/me")) return pathname.startsWith("/me");
    if (href === "/trending") return pathname.startsWith("/trending");
    if (href === "/system") return pathname.startsWith("/system");
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[150]">
      <nav className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1.5 flex items-center justify-around shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-x-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex-1 flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all active:scale-95"
            >
              <div className={`relative z-10 transition-colors duration-300 ${active ? "text-blue-400" : "text-slate-500"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black tracking-tighter transition-colors duration-300 ${active ? "text-white" : "text-slate-500"}`}>
                {item.label}
              </span>

              {active && <div className="absolute inset-0 bg-white/5 rounded-2xl -z-0" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
