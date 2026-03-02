"use client";

import Link from "next/link";
import { ArrowLeftRight, LayoutList, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof LayoutList;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/system", label: "운영 대시보드", icon: LayoutList },
  { href: "/admin", label: "관리자 콘솔", icon: ShieldCheck },
];

export default function SystemSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="my-4">
      <div className="w-full flex flex-wrap items-center gap-2 p-1 bg-slate-900/40 border border-slate-800 rounded-2xl">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
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
        <span className="inline-flex items-center gap-2 px-3 py-2 text-[10px] text-slate-500 border border-transparent rounded-xl ml-auto">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          운영/사용자 이동
        </span>
      </div>
    </nav>
  );
}
