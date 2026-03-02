import MeSectionNav from "@/components/MeSectionNav";
import WorkspaceHubNav from "@/components/WorkspaceHubNav";

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
