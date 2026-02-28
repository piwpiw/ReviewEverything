import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

// Using Mock wrapper directly for preview, same logic as index page
const MOCK_DETAIL = { id: 1, title: "[강남] 최고급 프리미엄 오마카세 2인 식사권", location: "서울 강남구", media_type: "IP", campaign_type: "VST", platform: { name: "Revu" }, thumbnail_url: "https://images.unsplash.com/photo-1544025162-831518f8887b?auto=format&fit=crop&q=80&w=1200", reward: "오마카세 A코스 2인 (18만원 상당)", url: "https://example.com/apply", snapshots: [{ recruit_count: 5, applicant_count: 2, competition_rate: 0.4 }] };

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    let campaign: any = null;

    try {
        if (!isNaN(id)) {
            campaign = await db.campaign.findUnique({
                where: { id },
                include: {
                    platform: true,
                    snapshots: {
                        orderBy: { scraped_at: 'desc' },
                        take: 1
                    }
                }
            });
        }
    } catch (e) {
        console.error("Database fetch failed on detail page", e);
    }

    // Fallback for demo
    if (!campaign) {
        if (resolvedParams.id === "1" || isNaN(id)) {
            campaign = MOCK_DETAIL;
        } else {
            return notFound();
        }
    }

    const compRate = campaign.snapshots[0]?.competition_rate || 0;

    return (
        <main className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8 pb-32">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors w-max px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                <span>&larr;</span> 목록으로 돌아가기
            </Link>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                    <img src={campaign.thumbnail_url} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <span className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-lg text-sm shadow-lg">{campaign.platform.name}</span>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col gap-8 bg-slate-50/50">
                    <div>
                        <div className="flex gap-2 mb-3">
                            <span className="text-xs font-black text-blue-600 tracking-widest uppercase bg-blue-100 px-2 py-1 rounded">경쟁률 {compRate}:1</span>
                            <span className="text-xs font-bold text-slate-500 tracking-widest uppercase bg-slate-200 px-2 py-1 rounded">D-12</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">{campaign.title}</h1>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">🎁</div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">제공 내역</div>
                                <div className="font-bold text-slate-800">{campaign.reward || "상세 페이지 참조"}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">모집 미디어</div>
                                <div className="font-bold text-slate-800">{campaign.media_type === 'IP' ? '인스타그램' : '블로그'}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">방문 지역</div>
                                <div className="font-bold text-slate-800">{campaign.location}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-200">
                        <a href={campaign.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-lg hover:shadow-blue-500/30 text-lg">
                            원본 플랫폼에서 지원하기 &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
