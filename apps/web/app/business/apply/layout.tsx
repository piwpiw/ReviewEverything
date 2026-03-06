import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "파트너 신청 | 리뷰에브리띵",
  description: "광고주 파트너 신청 절차와 접수 경로를 확인할 수 있습니다.",
  alternates: {
    canonical: "/business/apply",
  },
};

export default function BusinessApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
