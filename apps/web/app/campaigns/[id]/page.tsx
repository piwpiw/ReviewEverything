import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArrowLeft, ExternalLink, MapPin, Gift, Share2, Calendar, Activity } from "lucide-react";

type CampaignPlatform = {
  name: string;
};

type CampaignSnapshot = {
  recruit_count: number | null;
  applicant_count: number | null;
  competition_rate: number | null;
};

type CampaignModel = {
  id: number;
  title: string;
  location: string | null;
  media_type: string | null;
  campaign_type: string | null;
  platform: CampaignPlatform;
  thumbnail_url: string | null;
  reward_text: string | null;
  url: string;
  snapshots: CampaignSnapshot[];
  apply_end_date: Date | null;
};

const getDDay = (date: Date | null) => {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "마감됨";
  if (days === 0) return "오늘 마감";
  return `D-${days}`;
};

export default async function CampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  let campaign: CampaignModel | null = null;

  try {
    if (!Number.isNaN(id)) {
      const dbCampaign = await db.campaign.findUnique({
        where: { id },
        include: {
          platform: true,
          snapshots: {
            orderBy: { scraped_at: "desc" },
            take: 1,
          },
        },
      });

      if (dbCampaign) {
        campaign = {
          id: dbCampaign.id,
          title: dbCampaign.title,
          location: dbCampaign.location,
          media_type: dbCampaign.media_type,
          campaign_type: dbCampaign.campaign_type,
          platform: { name: dbCampaign.platform.name },
          thumbnail_url: dbCampaign.thumbnail_url,
          reward_text: dbCampaign.reward_text,
          url: dbCampaign.url,
          apply_end_date: dbCampaign.apply_end_date,
          snapshots: dbCampaign.snapshots.map((snapshot) => ({
            recruit_count: snapshot.recruit_count,
            applicant_count: snapshot.applicant_count,
            competition_rate: Number(snapshot.competition_rate),
          })),
        };
      }
    }
  } catch (error) {
    console.error("Database fetch failed on detail page", error);
  }

  if (!campaign) {
    return notFound();
  }

  const compRate = campaign.snapshots[0]?.competition_rate ?? 0;
  const mediaTypeLabel = campaign.media_type === "IP" ? "인스타그램" :
    campaign.media_type === "YP" ? "유튜브" : "네이버 블로그";
  const dDay = getDDay(campaign.apply_end_date);

  const thumbnailUrl =
    campaign.thumbnail_url ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200";

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-12 flex flex-col gap-10 pb-40">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors w-max px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
      </Link>

      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side: Visuals */}
        <div className="w-full lg:w-[55%] h-[400px] lg:h-auto relative">
          <Image
            src={thumbnailUrl}
            alt={`${campaign.title} thumbnail`}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
            <div className="flex gap-2 mb-4">
              <span className="bg-blue-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-xl backdrop-blur-md">
                {campaign.platform.name}
              </span>
              <span className="bg-white/90 text-slate-900 font-black px-4 py-2 rounded-xl text-xs shadow-xl backdrop-blur-md">
                {campaign.campaign_type === 'VST' ? '방문 체험단' : '배송형 제품'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">{campaign.title}</h1>
          </div>
        </div>

        {/* Right Side: Data */}
        <div className="w-full lg:w-[45%] p-10 md:p-14 flex flex-col gap-10 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                <Activity className="w-3 h-3" /> 경쟁률
              </div>
              <div className="text-2xl font-black text-slate-900">{compRate}:1</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                <Calendar className="w-3 h-3" /> 남은 기간
              </div>
              <div className="text-2xl font-black text-slate-900">{dDay || "정보 없음"}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">제공 혜택 및 리워드</div>
                <div className="font-bold text-slate-800 leading-snug">{campaign.reward_text || "모집 상세 페이지에서 제공 혜택을 확인하세요."}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">매체 타입</div>
                  <div className="font-bold text-slate-800 text-sm">{mediaTypeLabel}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">진행 지역</div>
                  <div className="font-bold text-slate-800 text-sm">{campaign.location || "전국 / 재택 가능"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <a
              href={campaign.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-black py-6 rounded-[1.5rem] hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-2xl hover:shadow-blue-500/40 text-lg group"
            >
              캠페인 신청하러 가기
              <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </a>
            <p className="text-center text-[10px] text-slate-400 font-bold mt-4 tracking-tight">본 캠페인은 외부 플랫폼({campaign.platform.name})에서 관리하며 신청 시 해당 사이트로 이동합니다.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
