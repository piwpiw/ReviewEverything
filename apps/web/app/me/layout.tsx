import type { Metadata } from "next";
import MeSectionNav from "@/components/MeSectionNav";
import WorkspaceHubNav from "@/components/WorkspaceHubNav";

export const metadata: Metadata = {
  title: "내 워크스페이스 | 리뷰에브리띵",
  description: "내 활동, 일정, 알림, 콘솔을 한 흐름으로 확인하는 사용자 작업 공간입니다.",
  alternates: {
    canonical: "/me",
  },
};

export const dynamic = "force-dynamic";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <WorkspaceHubNav
        current="me"
        title="사용자 대시보드"
        description="내 활동, 캘린더, 알림, 프로젝트 콘솔까지 한 화면으로 관리합니다."
      />
      <div className="max-w-[1700px] mx-auto px-4 md:px-8">
        <MeSectionNav />
      </div>
      {children}
    </div>
  );
}
