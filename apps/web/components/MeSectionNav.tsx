"use client";

import Link from "next/link";
import { CalendarDays, LayoutDashboard, Settings, Bell, Cpu } from "lucide-react";
import { usePathname } from "next/navigation";

type MeSection = "overview" | "calendar" | "notifications" | "console" | "settings";

type MenuItem = {
  key: MeSection;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const MENU_ITEMS: MenuItem[] = [
  { key: "overview", href: "/me", label: "내 활동", icon: LayoutDashboard },
  { key: "calendar", href: "/me/calendar", label: "캘린더", icon: CalendarDays },
  { key: "notifications", href: "/me/notifications", label: "알림", icon: Bell },
  { key: "console", href: "/me/console", label: "프로젝트 콘솔", icon: Cpu },
  { key: "settings", href: "/me/settings", label: "설정", icon: Settings },
];

export default function MeSectionNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/me") return pathname === "/me";
    return pathname.startsWith(href);
  };

  return (
    <nav className="mt-2 mb-4 overflow-x-auto">
      <div className="w-full flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                active
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
