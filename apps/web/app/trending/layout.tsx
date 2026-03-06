import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "트렌드 센터 | 리뷰에브리띵",
  description: "실시간/폴백 데이터 기반 인기 캠페인 추이를 확인합니다.",
  alternates: {
    canonical: "/trending",
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
