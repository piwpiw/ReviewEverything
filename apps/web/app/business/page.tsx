import React from 'react';
import Link from 'next/link';
import {
    BarChart3,
    CheckCircle2,
    Users,
    Zap,
    ArrowRight,
    Star,
    Search,
    MessageSquare
} from 'lucide-react';

export default function BusinessPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
                </div>

                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 mb-6 border border-blue-100">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-black uppercase tracking-widest">Business Partner Program</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-[1.1]">
                            가장 스마트한 <br />
                            <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">체험단 모집 솔루션</span>
                        </h1>

                        <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">
                            대한민국 모든 체험단 정보를 한 번에 모아보는 ReviewEverything에서<br />
                            귀하의 비즈니스를 가장 빛나게 홍보하고 최고의 인플루언서를 만나보세요.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/business/apply"
                                className="w-full sm:w-auto px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl shadow-slate-200 flex items-center justify-center gap-2 hover:translate-y-[-4px] transition-all"
                            >
                                파트너십 신청하기
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#features"
                                className="w-full sm:w-auto px-8 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
                            >
                                더 알아보기
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: '누적 체험단 수', value: '50,000+', icon: Search },
                            { label: '활성 광고주', value: '1,200+', icon: Users },
                            { label: '일일 활성 유저', value: '8,500+', icon: Zap },
                            { label: '리뷰 생성률', value: '98.5%', icon: BarChart3 },
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                                <stat.icon className="w-6 h-6 text-blue-600 mb-4" />
                                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-tight">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Us Section */}
            <section id="features" className="py-32">
                <div className="container mx-auto px-6">
                    <div className="mb-20 text-center">
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">
                            왜 ReviewEverything 파트너인가요?
                        </h2>
                        <p className="text-slate-500 font-medium">단순한 모집을 넘어 데이터 기반의 성장을 지원합니다.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {[
                            {
                                title: '통합 수집 엔진',
                                desc: '주요 플랫폼의 데이터를 실시간으로 수집하여 귀하의 캠페인을 가장 눈에 띄는 곳에 배치합니다.',
                                icon: Search
                            },
                            {
                                title: '정밀 타겟 매칭',
                                desc: '지역, 카테고리, 미디어 타입별로 최적화된 인플루언서 풀을 통해 전환율을 극대화합니다.',
                                icon: Users
                            },
                            {
                                title: '실시간 성과 추적',
                                desc: '모집 현황부터 경쟁률 분석까지 모든 데이터를 투명하게 대시보드로 제공합니다.',
                                icon: BarChart3
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:rotate-6 transition-all duration-300">
                                    <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing/Action Section */}
            <section className="py-32 bg-slate-900 rounded-[4rem] mx-6 mb-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/20 blur-[100px]" />

                <div className="container mx-auto px-12 relative z-10 text-center">
                    <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
                        지금 바로 첫 번째 <br />
                        성과를 경험해보세요.
                    </h2>
                    <p className="text-blue-200 text-lg mb-12 max-w-xl mx-auto font-medium">
                        비즈니스 파트너 등록 시 전담 매니저가 연락을 드려 <br />
                        최적의 마케팅 전략을 함께 고민해드립니다.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button className="px-10 py-6 bg-white text-slate-900 rounded-3xl font-black text-xl shadow-xl hover:translate-y-[-4px] transition-all">
                            상담 신청하기 (무료)
                        </button>
                        <div className="flex items-center gap-4 text-blue-300 font-bold">
                            <CheckCircle2 className="w-6 h-6" />
                            위약금 없음
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <CheckCircle2 className="w-6 h-6" />
                            추가 비용 제로
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer-like section */}
            <footer className="py-20 border-t border-slate-100">
                <div className="container mx-auto px-6 text-center">
                    <div className="text-2xl font-black tracking-tighter text-slate-900 mb-4 italic">ReviewEverything.</div>
                    <p className="text-slate-400 text-sm font-bold tracking-tight">© 2026 BohemianStudio. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
