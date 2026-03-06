import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캠페인 탐색 | 리뷰에브리띵",
  description: "필터, 정렬, 지도/리스트 모드로 리뷰 캠페인을 탐색합니다.",
  alternates: {
    canonical: "/campaigns",
  },
};

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
