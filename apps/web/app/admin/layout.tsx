import AdminSectionNav from "@/components/AdminSectionNav";
import WorkspaceHubNav from "@/components/WorkspaceHubNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <WorkspaceHubNav
        current="admin"
        title="운영 허브"
        description="운영 상태, 플랫폼 상태, 수집 이력, 분석까지 운영팀 관점으로 확인합니다."
      />
      <div className="max-w-[1700px] mx-auto px-4 md:px-8">
        <AdminSectionNav />
        {children}
      </div>
    </div>
  );
}
