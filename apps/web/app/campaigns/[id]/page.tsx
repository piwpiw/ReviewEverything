import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

const MEDIA_LABEL: Record<string, string> = { IP: "인스타그램", BP: "네이버 블로그", YP: "유튜브", OTHER: "기타" };
const TYPE_LABEL: Record<string, string> = { VST: "방문 체험단", SHP: "무료 배송 제품", PRS: "기자단/앰버서더" };
const MEDIA_ICON: Record<string, string> = { IP: "📸", BP: "✍️", YP: "🎬", OTHER: "🔗" };

const getDDay = (date: Date | null) => {
  if (!date) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "마감됨";
  if (diff === 0) return "오늘 마감";
  return `D-${diff}`;
};

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return notFound();

  let campaign: any = null;
  let relatedCampaigns: any[] = [];

  try {
    [campaign, relatedCampaigns] = await Promise.all([
      db.campaign.findUnique({
        where: { id: numId },
        include: {
          platform: true,
          snapshots: { orderBy: { scraped_at: "desc" }, take: 3 },
        },
      }),
      db.campaign.findMany({
        where: { id: { not: numId } },
        orderBy: { created_at: "desc" },
        take: 4,
        include: { platform: true, snapshots: { orderBy: { scraped_at: "desc" }, take: 1 } },
      }),
    ]);
  } catch {
    return notFound();
  }

  if (!campaign) return notFound();

  const snap = campaign.snapshots[0] ?? {};
  const recruited = snap.recruit_count ?? 0;
  const applied = snap.applicant_count ?? 0;
  const compRate = recruited > 0 ? (applied / recruited).toFixed(1) : "0";
  const progress = recruited > 0 ? Math.min((applied / recruited) * 100, 100) : 0;
  const dDay = getDDay(campaign.apply_end_date);
  const thumb = campaign.thumbnail_url ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1400";

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 pb-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-6">
        <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
        <span>›</span>
        <span className="text-slate-600">{campaign.platform?.name}</span>
        <span>›</span>
        <span className="text-slate-900 line-clamp-1">{campaign.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left: Image ── */}
        <div className="lg:col-span-5">
          <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl shadow-slate-900/10">
            <Image
              src={thumb}
              alt={campaign.title}
              fill
              className="object-cover"
              priority
              unoptimized={thumb.includes("unsplash")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Platform badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-blue-600/90 backdrop-blur-sm text-white text-xs font-black shadow-lg">
              {campaign.platform?.name}
            </div>
            {/* D-Day */}
            {dDay && (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-xs font-black ${dDay.includes("D-") && parseInt(dDay.split("-")[1]) <= 3
                  ? "bg-rose-500 text-white"
                  : "bg-white/90 text-slate-900"
                }`}>
                {dDay}
              </div>
            )}
          </div>

          {/* Snapshot history (mini chart) */}
          {campaign.snapshots.length > 1 && (
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">신청 추이</div>
              <div className="flex items-end gap-2 h-12">
                {campaign.snapshots.slice().reverse().map((s: any, i: number) => {
                  const h = recruited > 0 ? Math.max((s.applicant_count / recruited) * 100, 4) : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-blue-500 transition-all"
                        style={{ height: `${h}%`, minHeight: "4px" }}
                      />
                      <span className="text-[8px] text-slate-400">{s.applicant_count}명</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Info ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
                {MEDIA_ICON[campaign.media_type] ?? "🔗"} {MEDIA_LABEL[campaign.media_type] ?? "기타"}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-black">
                {TYPE_LABEL[campaign.campaign_type] ?? "기타"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {campaign.title}
            </h1>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "모집 인원", value: recruited > 0 ? `${recruited.toLocaleString()}명` : "비공개" },
              { label: "현재 신청", value: applied > 0 ? `${applied.toLocaleString()}명` : "-" },
              {
                label: "경쟁률", value: recruited > 0 ? `${compRate}:1` : "-",
                cls: Number(compRate) >= 3 ? "text-rose-600" : "text-slate-900"
              },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className={`text-lg font-black ${stat.cls ?? "text-slate-900"}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {recruited > 0 && (
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                <span>모집 현황</span>
                <span className={progress >= 100 ? "text-rose-500" : "text-blue-600"}>{Math.round(progress)}% 채워짐</span>
              </div>
              <div className="progress-bar h-2.5">
                <div
                  className={`progress-fill${progress >= 100 ? " hot" : ""}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {[
              { icon: "🎁", label: "제공 혜택", value: campaign.reward_text || "모집 페이지 참조" },
              { icon: "📍", label: "진행 지역", value: campaign.location || "전국 / 재택 가능" },
              { icon: "📅", label: "마감일", value: campaign.apply_end_date ? new Date(campaign.apply_end_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "상시 모집" },
              { icon: "🏢", label: "플랫폼", value: campaign.platform?.name ?? "-" },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-4 px-5 py-4">
                <span className="text-lg shrink-0">{row.icon}</span>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href={campaign.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/30 text-base group"
          >
            {campaign.platform?.name}에서 신청하기
            <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-center text-[10px] text-slate-400 font-bold -mt-4">
            버튼 클릭 시 {campaign.platform?.name} 원본 페이지로 이동합니다
          </p>
        </div>
      </div>

      {/* ── Related ── */}
      {relatedCampaigns.length > 0 && (
        <div className="mt-16">
          <h2 className="text-lg font-black text-slate-900 mb-5">다른 체험단도 확인해보세요</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedCampaigns.map(c => {
              const rSnap = c.snapshots[0] ?? {};
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all lift-card">
                  <div className="relative h-28 bg-slate-100 overflow-hidden">
                    {c.thumbnail_url ? (
                      <Image src={c.thumbnail_url} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized={c.thumbnail_url.includes("unsplash")} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl">📋</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-[9px] font-black text-slate-400 mb-1">{c.platform?.name}</div>
                    <div className="text-[11px] font-bold text-slate-900 line-clamp-2">{c.title}</div>
                    {rSnap.recruit_count > 0 && (
                      <div className="text-[10px] text-rose-500 font-black mt-1">
                        경쟁 {(rSnap.applicant_count / rSnap.recruit_count).toFixed(1)}:1
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
