"use client";

import dynamic from "next/dynamic";

type Campaign = {
  id?: string | number;
  title?: string;
  campaign_type?: string;
  lat?: number | string;
  lng?: number | string;
  thumbnail_url?: string;
  region_depth1?: string;
  region_depth2?: string;
  url?: string;
  geo_match_source?: string;
  geo_match_score?: number;
  geo_store_key?: string;
  reward_text?: string;
};

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[560px] rounded-[2rem] bg-slate-100" />,
});

export default function MapViewCompat({
  campaigns,
  fallbackActionHref,
  fallbackActionLabel,
}: {
  campaigns: Campaign[];
  fallbackActionHref?: string;
  fallbackActionLabel?: string;
}) {
  return (
    <MapView
      campaigns={campaigns}
      fallbackActionHref={fallbackActionHref}
      fallbackActionLabel={fallbackActionLabel}
    />
  );
}
