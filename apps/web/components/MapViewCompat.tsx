"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[560px] rounded-[2rem] bg-slate-100" />,
});

export default function MapViewCompat({ campaigns }: { campaigns: any[] }) {
  return <MapView campaigns={campaigns as any} />;
}
