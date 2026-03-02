import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Search, Star, Users } from "lucide-react";

const stats = [
  { label: "누적 관리 캠페인", value: "50,000+" },
  { label: "파트너사", value: "1,200+" },
  { label: "월간 운영 가이드", value: "8,500+" },
  { label: "운영 정확도", value: "98.5%" },
];

const highlights = [
  {
    title: "검증된 검색 UX",
    description: "키워드·지역·플랫폼 조건을 조합해 원하는 캠페인만 빠르게 추출하고, 다음 액션을 바로 이어갈 수 있게 구성했습니다.",
    icon: Search,
  },
  {
    title: "운영 효율 중심",
    description: "지도, 링크, 보상, 지표를 한 화면에서 확인해 캠페인 우선순위를 즉시 판단할 수 있습니다.",
    icon: Users,
  },
  {
    title: "데이터 기반 운영",
    description: "실시간 지표와 수집 상태를 기반으로 실행/중단/보정 판단을 신속하게 수행하도록 정렬과 알림을 제공합니다.",
    icon: BarChart3,
  },
];

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 mb-6 border border-blue-100">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">Business Partner</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-[1.1]">
              리뷰 운영을 위한 첫걸음, ReviewEverything과 함께 시작하세요.
              <br />
              <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">작업은 빠르게, 판단은 정확하게</span>
            </h1>

            <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">
              ReviewEverything은 캠페인 검색, 링크 추적, 지도 조회, 수집 상태 점검을 한 번에 처리하는
              운영 플랫폼입니다.
              팀의 실무 흐름에 맞게 캠페인을 정렬하고 바로 실행할 수 있는 구조로 설계되어 있습니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/business/apply"
                className="w-full sm:w-auto px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl shadow-slate-200 flex items-center justify-center gap-2 hover:translate-y-[-4px] transition-all"
              >
                파트너 신청하기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
              >
                주요 기능 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-32">
        <div className="container mx-auto px-6">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">
              ReviewEverything 파트너가 얻는 운영 이점
            </h2>
            <p className="text-slate-500 font-medium">복잡한 리뷰 운영을 한 번에 정리하고, 실행 가능한 데이터로 전환합니다.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {highlights.map((feature) => (
              <div key={feature.title} className="group">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:rotate-6 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-slate-900 rounded-[4rem] mx-6 mb-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/20 blur-[100px]" />

        <div className="container mx-auto px-12 relative z-10 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
            파트너 운영, 여기서부터 시작하세요.
            <br />
            다음 단계는 지금 바로 진행하면 됩니다.
          </h2>
          <p className="text-blue-200 text-lg mb-12 max-w-xl mx-auto font-medium">
            캠페인 검색/지표/지도 기반 운영을 한 화면에서 시작해보세요.
            필요한 액션을 빠르게 이어가기 위해 바로 실행 버튼과 상태 추적이 기본 제공됩니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-6 bg-white text-slate-900 rounded-3xl font-black text-xl shadow-xl hover:translate-y-[-4px] transition-all">
              파트너 신청 시작
            </button>
            <div className="flex items-center gap-4 text-blue-300 font-bold">
              <CheckCircle2 className="w-6 h-6" />
              별도 세팅 없이 바로 시작
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <CheckCircle2 className="w-6 h-6" />
              단계별 운영 가이드 제공
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-black tracking-tighter text-slate-900 mb-4 italic">ReviewEverything.</div>
          <p className="text-slate-400 text-sm font-bold tracking-tight">© 2026 BohemianStudio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
