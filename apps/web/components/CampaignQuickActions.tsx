"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, MapPinned, Share2, Check } from "lucide-react";

type CampaignQuickActionsProps = {
  campaignUrl: string;
  campaignTitle: string;
  campaignId: number;
  platformName: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function buildMapTarget(location?: string | null, lat?: number | null, lng?: number | null) {
  if (Number.isFinite(lat as number) && Number.isFinite(lng as number)) {
    return `https://maps.google.com/?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
  }
  if (!location) return null;
  return `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
}

export default function CampaignQuickActions({
  campaignUrl,
  campaignTitle,
  campaignId,
  platformName,
  location,
  lat,
  lng,
}: CampaignQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const mapTarget = buildMapTarget(location, lat, lng);

  const copyLink = async () => {
    if (typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/campaigns/${campaignId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-auto">
      <div className="grid grid-cols-1 gap-3">
        <Link
          href={campaignUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/30 overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-3 text-lg">
            {platformName} 공식 페이지로 이동
            <ExternalLink className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <button
          type="button"
          onClick={copyLink}
          className="group relative flex items-center justify-center gap-3 w-full bg-white border border-slate-200 text-slate-900 font-black py-4 rounded-[2rem] hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          <span>{copied ? `${campaignTitle} 링크 복사됨` : "상세 링크 복사"}</span>
        </button>
      </div>

      {mapTarget ? (
        <Link
          href={mapTarget}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-[2rem] bg-indigo-50 text-slate-900 font-black hover:bg-indigo-100 transition-colors"
        >
          <MapPinned className="w-4 h-4" />
          위치 지도에서 보기
        </Link>
      ) : (
        <p className="text-xs text-slate-500">위치 좌표/키워드가 없어 지도 링크를 만들 수 없습니다.</p>
      )}
    </div>
  );
}
