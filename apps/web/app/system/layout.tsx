import SystemSectionNav from "@/components/SystemSectionNav";
import WorkspaceHubNav from "@/components/WorkspaceHubNav";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <WorkspaceHubNav
        current="system"
        title="시스템 운영 대시보드"
        description="수집 파이프라인, 작업 상태, 알림과 지표를 빠르게 점검하고 대응할 수 있습니다."
      />
      <div className="max-w-[1700px] mx-auto px-4 md:px-8">
        <SystemSectionNav />
        {children}
      </div>
    </div>
  );
}
