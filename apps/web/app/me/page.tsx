import ManagerDashboard from "@/components/ManagerDashboard";

export default async function MePage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
    const params = await searchParams;
    const userId = Number(params?.userId || 1);

    return (
        <main className="max-w-[1200px] mx-auto px-6 py-8">
            <h1 className="text-2xl font-black text-slate-900 mb-2">내 매니저 보드</h1>
            <p className="text-sm text-slate-500 mb-6">일정, 정산, 알림을 한 화면에서 확인합니다.</p>
            <ManagerDashboard userId={userId || 1} />
        </main>
    );
}
