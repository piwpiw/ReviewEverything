"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell py-10 md:py-14">
      <section className="section-card p-6 md:p-8 max-w-3xl">
        <p className="section-title">오류 복구</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-2">
          페이지를 불러오는 중 문제가 발생했습니다.
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          잠시 후 다시 시도하거나 홈으로 이동해 검색 흐름을 이어가세요.
        </p>
        {error?.message ? (
          <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-100/40 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 px-4 py-3 text-xs">
            {error.message}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-500"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
          >
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
