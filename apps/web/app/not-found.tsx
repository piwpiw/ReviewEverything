import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell py-10 md:py-14">
      <section className="section-card p-6 md:p-8 max-w-3xl">
        <p className="section-title">404</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-2">
          요청한 페이지를 찾을 수 없습니다.
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          경로가 변경되었거나 삭제되었을 수 있습니다. 아래 링크로 주요 화면으로 이동하세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-500"
          >
            캠페인 목록
          </Link>
          <Link
            href="/me"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
          >
            사용자 대시보드
          </Link>
        </div>
      </section>
    </main>
  );
}
