import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import AddToScheduleButton from "@/components/AddToScheduleButton";
import CampaignQuickActions from "@/components/CampaignQuickActions";
import { Clock, MapPin, Gift, Database, ChevronRight, TrendingUp, Target, Zap, Users, CheckCircle2, ShieldCheck } from "lucide-react";

type CampaignWithPlatformAndSnapshots = Prisma.CampaignGetPayload<{
  include: {
    platform: true;
    snapshots: true;
  };
}>;

const TYPE_LABEL: Record<string, string> = {
  VST: "리뷰",
  SHP: "체험",
  PRS: "홍보",
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDDay = (date: Date | null) => {
  if (!date) return { label: "미정", color: "text-blue-500 bg-blue-50" };
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: "마감", color: "text-slate-400 bg-slate-50" };
  if (diff === 0) return { label: "D-0", color: "text-rose-600 bg-rose-50 animate-pulse" };
  if (diff <= 3) return { label: `D-${diff}`, color: "text-rose-500 bg-rose-50" };
  return { label: `D-${diff}`, color: "text-indigo-600 bg-indigo-50" };
};

const toCompetitionRate = (candidate: unknown) => {
  const value = toNumber(candidate, 0);
  return Number.isFinite(value) ? value : 0;
};

const winStatusLabel = (probability: number) => {
  if (probability >= 70) return "강함";
  if (probability >= 40) return "보통";
  return "낮음";
};

const compRateValue = (applicant: number, recruited: number) => {
  if (recruited <= 0) return 0;
  return applicant / recruited;
};

const compRateValueLabel = (compRate: number) => compRate.toFixed(1);

export default async function CampaignDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ userId?: string }>;
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const userIdRaw = sp?.userId || "1";
  const parsedUserId = Number.parseInt(userIdRaw, 10);
  const userId = Number.isInteger(parsedUserId) ? parsedUserId : 1;
  const campaignId = Number.parseInt(id, 10);

  if (!Number.isInteger(campaignId)) return notFound();

  const campaign = (await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      platform: true,
      snapshots: {
        orderBy: { scraped_at: "desc" },
        take: 7,
      },
    },
  })) as CampaignWithPlatformAndSnapshots | null;

  if (!campaign) return notFound();

  const whereConditions: Prisma.CampaignWhereInput[] = [{ platform_id: campaign.platform_id }];
  if (campaign.category) whereConditions.push({ category: campaign.category });
  if (campaign.region_depth1) whereConditions.push({ region_depth1: campaign.region_depth1 });

  const related = await db.campaign.findMany({
    where: {
      id: { not: campaignId },
      OR: whereConditions,
    },
    take: 4,
    orderBy: { created_at: "desc" },
    include: {
      platform: true,
      snapshots: {
        orderBy: { scraped_at: "desc" },
        take: 1,
      },
    },
  });

  const latestSnap = campaign.snapshots[0];
  const recruited = Math.max(1, toNumber(latestSnap?.recruit_count ?? campaign.recruit_count, 1));
  const applicant = Math.max(0, toNumber(latestSnap?.applicant_count ?? campaign.applicant_count, 0));
  const competitionRate = toCompetitionRate(latestSnap?.competition_rate ?? campaign.competition_rate);
  const winProbability = Math.min(99, Math.max(1, Math.round(100 - competitionRate * 15)));
  const { label: dLabel, color: dColor } = getDDay(campaign.apply_end_date);
  const progressPercent = Math.max(0, Math.min(100, (applicant / (recruited * 2)) * 100));

  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 pb-40 flex flex-col gap-10">
      <nav className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">
        <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/?platform_id=${campaign.platform_id}`} className="hover:text-blue-600 transition-colors">
          {campaign.platform?.name ?? "플랫폼"}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 truncate max-w-[200px]">{campaign.title}</span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="relative rounded-[3rem] overflow-hidden aspect-[1/1] shadow-2xl border border-slate-100 group">
            <Image
              src={campaign.thumbnail_url || "https://via.placeholder.com/800"}
              alt={campaign.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-[3s]"
              unoptimized={campaign.thumbnail_url?.includes("unsplash")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-slate-900">
                {(campaign.platform?.name ?? "플랫폼")}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Zap className="w-5 h-5 text-amber-400 fill-current" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">실시간 합격 예측</span>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black">{winProbability}%</span>
                <span className="text-sm font-bold text-blue-300 mb-2">{winStatusLabel(winProbability)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">경쟁률</div>
                  <div className="text-lg font-black">{competitionRate.toFixed(2)}x</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">성공확률</div>
                  <div className="text-lg font-black text-amber-400">{Math.round(winProbability / 4)}/25</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm ${dColor}`}>
                {dLabel}
              </span>
              <span className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-sm">
                {TYPE_LABEL[campaign.campaign_type || ""] ?? "기타"}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">{campaign.title}</h1>
            <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-300" />
                <span>플랫폼 {campaign.platform?.name ?? "정보 없음"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-300" />
                <span>최종 갱신: {new Date(campaign.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                  <Gift className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">보상</span>
              </div>
              <div className="text-lg font-black text-slate-800 leading-tight">
                {campaign.reward_text || "보상은 개별 공지 기준 안내됩니다."}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">지역</span>
              </div>
              <div className="text-lg font-black text-slate-800 leading-tight">
                {campaign.location || "지역 정보가 없습니다."}
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                캠페인 지표
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "모집 수", v: recruited.toLocaleString(), sub: "명", icon: Target },
                { label: "지원 수", v: applicant.toLocaleString(), sub: "명", icon: Users },
                { label: "경쟁률", v: compRateValueLabel(compRateValue(applicant, recruited)), sub: "배수", icon: Zap },
              ].map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <metric.icon className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase">{metric.label}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {metric.v}
                    <span className="text-[10px] ml-1 opacity-40">{metric.sub}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${compRateValue(applicant, recruited) > 1 ? "bg-rose-500 shadow-lg shadow-rose-500/20" : "bg-blue-500 shadow-lg shadow-blue-500/20"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                링크 활성됨
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3 h-3" />
                실시간 업데이트
              </div>
              <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black border border-slate-100 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3 h-3" />
                플랫폼 검증완료
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <CampaignQuickActions
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              campaignUrl={campaign.url}
              platformName={campaign.platform?.name || "플랫폼"}
              location={campaign.location}
              lat={campaign.lat}
              lng={campaign.lng}
            />
            <AddToScheduleButton
              userId={userId}
              campaignId={campaign.id}
              defaultTitle={campaign.title}
              deadlineDateIso={campaign.apply_end_date ? campaign.apply_end_date.toISOString() : null}
            />
          </div>
        </div>
      </div>

      <section className="mt-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">관련 캠페인</h2>
          <Link href="/" className="text-[10px] font-black text-blue-600 hover:underline">전체 캠페인 보기</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((item: any) => {
            const relatedSnap = item.snapshots[0];
            const relatedComp = toNumber(relatedSnap?.applicant_count, 0) / Math.max(1, toNumber(relatedSnap?.recruit_count, 1));
            return (
              <Link
                key={item.id}
                href={`/campaigns/${item.id}`}
                className="group bg-white rounded-3xl border border-slate-100/60 p-5 hover:shadow-2xl transition-all hover:border-blue-100"
              >
                <div className="relative h-40 rounded-2xl overflow-hidden mb-4 shadow-inner">
                  <Image
                    src={item.thumbnail_url || "https://via.placeholder.com/400"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <span className="text-[9px] font-black text-blue-600 mb-1 block uppercase tracking-tighter">{item.platform?.name}</span>
                <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-relaxed h-[2.6rem] mb-2">{item.title}</h4>
                <p className="text-[10px] font-black text-slate-400 italic">경쟁률 {relatedComp.toFixed(1)}:1</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
