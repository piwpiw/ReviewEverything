"use client";

import Link from "next/link";
import { Activity, ChartLine, Layers, Play, Server, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type AdminSection = "overview" | "platforms" | "reviewers" | "history" | "analysis" | "system";

type MenuItem = {
  key: AdminSection;
  href: string;
  label: string;
  icon: typeof Activity;
  anchor?: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: "overview", href: "/admin#overview", label: "관리 개요", icon: Activity, anchor: "#overview" },
  { key: "platforms", href: "/admin#platforms", label: "플랫폼 관리", icon: Layers, anchor: "#platforms" },
  { key: "reviewers", href: "/admin#reviewers", label: "체험단 관리", icon: Users2, anchor: "#reviewers" },
  { key: "analysis", href: "/admin#analysis", label: "품질 분석", icon: ChartLine, anchor: "#analysis" },
  { key: "history", href: "/admin#history", label: "실행 이력", icon: Play, anchor: "#history" },
  { key: "system", href: "/system", label: "시스템 점검", icon: Server },
];

export default function AdminSectionNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash || "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const isActive = (item: MenuItem) => {
    if (item.key === "system") return pathname === "/system";
    if (item.key === "overview") return pathname === "/admin" && (!hash || hash === "#" || hash === "#overview");
    if (item.anchor) return pathname === "/admin" && hash === item.anchor;
    return pathname === "/admin";
  };

  return (
    <nav className="my-4">
      <div className="w-full flex flex-wrap items-center gap-2 p-1 bg-slate-900/30 border border-slate-800 rounded-2xl">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                active ? "bg-slate-900 text-white border border-slate-700" : "text-slate-300 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
