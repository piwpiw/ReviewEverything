import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">캘린더 페이지</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">캘린더 기능은 준비 중입니다. 잠시 후 최신 일정 화면으로 복구 예정입니다.</p>
        <div className="mt-6">
          <Link href="/me" className="text-blue-600 underline">
            사용자 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
