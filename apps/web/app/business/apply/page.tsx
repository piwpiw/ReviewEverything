import Link from "next/link";
import { ArrowLeft, ChevronRight, Mail, Send, Sparkles } from "lucide-react";

export default function BusinessApplyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="page-shell page-stack gap-4 max-w-4xl">
        <Link
          href="/business"
          aria-label="비즈니스 안내 페이지로 돌아가기"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg w-fit px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          파트너 안내로 돌아가기
        </Link>

        <section className="section-card p-6 md:p-8 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-blue-600 dark:text-blue-300 uppercase">
            <Sparkles className="w-4 h-4" />
            광고주 파트너 신청
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 dark:text-white">광고주 파트너 신청</h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            캠페인 등록부터 운영, 알림, 성과 분석까지 이어지는 파트너 전용 플로우를 신청과 동시에 준비합니다.
            아래 항목은 바로 실행 가능한 연결 동선입니다.
          </p>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">접수 상태와 복구 동선</h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
            <p className="text-xs font-black text-slate-600 dark:text-slate-200">status: manual-review</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              자동 연동이 지연되면 fallback 경로로 접수 상태를 유지합니다.
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-2 w-1/2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              아직 표시할 자동 검토 결과가 없습니다. 아래 버튼으로 다시 확인하세요.
            </p>
            <a
              href="/business/apply?retry=1"
              className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              상태 다시 시도
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="font-black text-slate-900 dark:text-slate-100">1단계</p>
              <p className="text-slate-500 dark:text-slate-300 mt-1">사업자/담당자 정보 등록</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="font-black text-slate-900 dark:text-slate-100">2단계</p>
              <p className="text-slate-500 dark:text-slate-300 mt-1">캠페인 타입/예산/일정 입력</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="font-black text-slate-900 dark:text-slate-100">3단계</p>
              <p className="text-slate-500 dark:text-slate-300 mt-1">승인 후 캠페인 공개, 즉시 조회</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="font-black text-slate-900 dark:text-slate-100">4단계</p>
              <p className="text-slate-500 dark:text-slate-300 mt-1">성과 리포트 연동 및 운영 알림</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-300/40 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3 text-sm">
            <Mail className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-300" />
            <div className="text-blue-900 dark:text-blue-200 leading-relaxed">
              신청은 메일 접수 후 1 영업일 내 검토 후 답변됩니다. 현재는 수동 접수 경로가 활성화되어 있습니다.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:partner@revieweverything.com?subject=%5B%EA%B4%91%EA%B3%A0%EC%A3%BC%20%ED%8C%8C%ED%8A%B8%EB%84%88%5D%20%EC%8B%A0%EC%B2%AD"
              aria-label="메일 앱으로 파트너 신청 메일 작성"
              className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-black transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              메일로 신청하기
              <Send className="w-4 h-4" />
            </a>
            <Link
              href="/business"
              aria-label="파트너 정책 페이지로 이동"
              className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black transition-colors hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              파트너 정책 확인
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
