"use client";

import { useEffect, useState } from "react";

export default function NavStats() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/public/stats");
        const data = (await res.json()) as { totalCampaigns?: number };
        if (!alive) return;
        setTotal(data.totalCampaigns ?? null);
      } catch {
        if (!alive) return;
        setTotal(0);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-[11px] font-black text-blue-700">
        {total === null ? "로딩..." : `${total.toLocaleString()}개`}
      </span>
    </div>
  );
}