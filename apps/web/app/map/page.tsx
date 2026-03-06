import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "지도 모드 | 리뷰에브리띵",
  description: "지도 기반으로 캠페인 위치를 확인하고 목록과 함께 비교할 수 있습니다.",
  alternates: {
    canonical: "/map",
  },
};

type SearchParams = {
  campaign_type?: string;
  media_type?: string;
  region_depth1?: string;
  region_depth2?: string;
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
  min_reward?: string;
  max_comp?: string;
  max_deadline_days?: string;
  permission_denied?: string;
};

export default async function MapRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const hasQueryPayload = typeof sp === "object" && sp !== null;

  if (!hasQueryPayload) {
    redirect("/?view=map&campaign_type=VST");
  }

  const params = new URLSearchParams();
  params.set("view", "map");

  // Preserve map permission state so the list view can show a recovery message.
  if (sp.permission_denied === "1") {
    params.set("permission_denied", "1");
  }

  const filterKeys: Array<keyof SearchParams> = [
    "campaign_type",
    "media_type",
    "region_depth1",
    "region_depth2",
    "category",
    "q",
    "sort",
    "page",
    "min_reward",
    "max_comp",
    "max_deadline_days",
  ];

  filterKeys.forEach((key) => {
    const value = sp[key];
    if (value) params.set(key, value);
  });

  if (!params.get("campaign_type")) {
    params.set("campaign_type", "VST");
  }

  redirect(`/?${params.toString()}`);
}
