import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Search, Star, Users } from "lucide-react";

const stats = [
  { label: "전체 캠페인", value: "50,000+" },
  { label: "활성 캠페인", value: "1,200+" },
  { label: "누적 신청", value: "8,500+" },
  { label: "성공률", value: "98.5%" },
];

const highlights = [
  {
    title: "체험단 캠페인 운영 전문화",
    description:
      "브랜드, 체험단, 블로거, 광고주를 한 화면에서 연결해 운영 상태를 한 번에 확인하고 관리할 수 있습니다.",
    icon: Search,
  },
  {
    title: "알림 기반 진행 관리",
    description:
      "캠페인 상태 변화, 신청/마감 타임라인, 품질 점검 결과를 실시간으로 추적해 놓친 기회를 줄입니다.",
    icon: Users,
  },
  {
    title: "채널별 성과 측정",
    description:
      "블로그, 인스타, 유튜브, 쿠폰 채널로 성과를 분리 측정하고 반응률, 전환율, 완료율을 기준으로 리포트를 비교합니다.",
    icon: BarChart3,
  },
];

export default function BusinessPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100">
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-200 mb-6 border border-blue-100 dark:border-blue-900">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">리뷰 단위 테스트 없이 운영</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 leading-[1.1]">
              체험단 운영이 더 빨라지고
              <br />
              <span className="text-blue-600 dark:text-blue-300 underline decoration-blue-200 underline-offset-8">실제로 신청 연결까지 바로</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 font-medium leading-relaxed max-w-2xl mx-auto">
              블로그-인스타-유튜브-제휴 파트너까지 운영 포인트를 한 화면에서 통합해,
              캠페인 등록부터 신청 관리, 결과 확인까지 바로 적용할 수 있습니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/business/apply"
                aria-label="광고주 파트너 신청 페이지로 이동"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-2xl dark:shadow-slate-950 flex items-center justify-center gap-2 hover:translate-y-[-3px] transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                캠페인 등록 신청
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                aria-label="기능 소개 섹션으로 이동"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-black text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                기능 소개 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">파트너 접수 status 패널</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                  status: manual-review · 연동 대기 시 fallback 큐를 사용합니다.
                </p>
              </div>
              <a
                href="/business?refresh=1"
                aria-label="파트너 접수 상태 다시 확인"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                다시 시도
              </a>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs font-black text-slate-500 dark:text-slate-300">loading preview</p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-2 w-2/3 rounded-full bg-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs font-black text-slate-500 dark:text-slate-300">fallback 안내</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                  외부 연동 실패 시 폴백 데이터 경로로 신청 동선을 유지합니다.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs font-black text-slate-500 dark:text-slate-300">빈 상태</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                  아직 접수 사례가 없습니다. 신청 후 운영팀이 순차 검토합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-100 dark:bg-slate-900/40">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-32">
        <div className="container mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">왜 우리 운영이 필요한가?</h2>
            <p className="text-slate-500 dark:text-slate-300 font-medium">
              체험단, 블로그, 인플루언서, 광고주를 한 번에 묶어 운영 기준을 통일하고,
              데이터 분석과 실행을 동시에 빠르게 진행할 수 있는 구조로 설계했습니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {highlights.map((feature) => (
              <div key={feature.title} className="group">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:rotate-6 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-300 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-slate-900 rounded-[4rem] mx-6 mb-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/20 blur-[100px]" />

        <div className="container mx-auto px-12 relative z-10 text-center">
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-8 leading-tight">
            지금 바로 시작하고
            <br />
            체험단 운영 프로세스를 한 번에 개선하세요
          </h2>
          <p className="text-blue-200 text-lg mb-12 max-w-xl mx-auto font-medium">
            브랜딩, 캠페인 등록, 신청 상태 추적, 성과 리포트까지 하나의 경로에서 확인하고 즉시 실행할 수 있도록 연결했습니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/business/apply"
              aria-label="지금 시작하고 파트너 신청하기"
              className="px-10 py-6 bg-white text-slate-900 rounded-3xl font-black text-xl shadow-xl hover:translate-y-[-4px] transition-all focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            >
              지금 시작하기
            </Link>
            <div className="flex items-center gap-4 text-blue-300 font-bold">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm">운영용 대시보드</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm">신뢰성 높은 운영 플로우</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 italic">ReviewEverything</div>
          <p className="text-slate-400 text-sm font-bold tracking-tight">2026 BohemianStudio. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}
