import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비즈니스 센터 | 리뷰에브리띵",
  description: "광고주와 파트너를 위한 캠페인 운영 소개 및 신청 페이지입니다.",
  alternates: {
    canonical: "/business",
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
