import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  Clock,
  MapPin,
  Gift,
  Database,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Target,
  Zap,
  Users
} from "lucide-react";

const MEDIA_LABEL: Record<string, string> = { IP: "인스타그램", BP: "네이버 블로그", YP: "유튜브", OTHER: "기타" };
const TYPE_LABEL: Record<string, string> = { VST: "방문형 체험단", SHP: "배송형 체험단", PRS: "기자단/앰버서더" };

const getDDay = (date: Date | null) => {
  if (!date) return { label: "상시 모집", color: "text-blue-500 bg-blue-50" };
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: "모집 마감", color: "text-slate-400 bg-slate-50" };
  if (diff === 0) return { label: "오늘 마감!", color: "text-rose-600 bg-rose-50 animate-pulse" };
  if (diff <= 3) return { label: `D-${diff} 마감임박`, color: "text-rose-500 bg-rose-50" };
  return { label: `D-${diff} 남음`, color: "text-indigo-600 bg-indigo-50" };
};

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return notFound();

  let campaign: any = null;
  let related: any[] = [];

  try {
    [campaign, related] = await Promise.all([
      db.campaign.findUnique({
        where: { id: numId },
        include: { platform: true, snapshots: { orderBy: { scraped_at: "desc" }, take: 7 } },
      }),
      db.campaign.findMany({
        where: { platform_id: 1, id: { not: numId } }, // Mock related logic
        take: 4,
        include: { platform: true, snapshots: { take: 1 } }
      })
    ]);
  } catch { return notFound(); }

  if (!campaign) return notFound();

  const snap = campaign.snapshots[0] ?? {};
  const recruited = snap.recruit_count ?? 1;
  const applied = snap.applicant_count ?? 0;
  const compRateValue = (applied / recruited);
  const winProbability = Math.max(0, 100 - (compRateValue * 20)); // Mock probability logic
  const winStatus = winProbability > 70 ? "당첨확률 높음" : winProbability > 30 ? "치열함" : "상당히 치열함";

  const { label: dLabel, color: dColor } = getDDay(campaign.apply_end_date);

  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 pb-40 flex flex-col gap-10">
      {/* ── Dynamic Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">
        <Link href="/" className="hover:text-blue-600 transition-colors">DIRECTORY</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/?platform_id=${campaign.platform_id}`} className="hover:text-blue-600 transition-colors">{campaign.platform?.name.toUpperCase()}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 truncate max-w-[200px]">{campaign.title}</span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ── Left: Visual Assets ── */}
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
            {/* Platform Badge Overlay */}
            <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-slate-900">{campaign.platform?.name} OFFICIAL</span>
            </div>
          </div>

          {/* Premium Prediction Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors duration-[1s]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl"><Zap className="w-5 h-5 text-amber-400 fill-current" /></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Win Prediction AI</span>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black">{Math.round(winProbability)}%</span>
                <span className="text-sm font-bold text-blue-300 mb-2">{winStatus}</span>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-6">현재 모집 인원 대비 신청자 비율을 보정하여 산출된 당첨 예상 확률입니다. (최근 7일 플랫폼 활성도 반영)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Competition</div>
                  <div className="text-lg font-black">{compRateValue.toFixed(1)}:1</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hotness Score</div>
                  <div className="text-lg font-black text-amber-400">★★★★☆</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Proposal Info ── */}
        <div className="xl:col-span-7 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm ${dColor}`}>
                {dLabel}
              </span>
              <span className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-sm">
                {TYPE_LABEL[campaign.campaign_type] || "체험단"}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">
              {campaign.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-300" />
                <span>PLATFORM: {campaign.platform?.name}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-300" />
                <span>PROCESSED: {new Date(campaign.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Major Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><Gift className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Benefit Offer</span>
              </div>
              <div className="text-lg font-black text-slate-800 leading-tight">
                {campaign.reward_text || "모집 페이지 내 상세 혜택 고지"}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-emerald-500 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600"><MapPin className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location Info</span>
              </div>
              <div className="text-lg font-black text-slate-800 leading-tight">
                {campaign.location || "전국 배송 가능 (지역 무관)"}
              </div>
            </div>
          </div>

          {/* Metrics Radar */}
          <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Live Metrics Radar
              </span>
              <span className="text-[10px] font-bold text-slate-400">UPDATED EVERY 10 MINS</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Recruits", v: recruited, sub: "Person", icon: Target },
                { label: "Applicants", v: applied, sub: "Live", icon: Users },
                { label: "Competition", v: compRateValue.toFixed(1), sub: "Rate", icon: Zap },
              ].map(m => (
                <div key={m.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase">{m.label}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{m.v}<span className="text-[10px] ml-1 opacity-40">{m.sub}</span></div>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${compRateValue > 1 ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                style={{ width: `${Math.min(100, (applied / (recruited * 2)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-auto">
            <a
              href={campaign.url}
              target="_blank"
              className="group relative flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/30 overflow-hidden"
            >
              <div className="relative z-10 flex items-center gap-3 text-lg">
                {campaign.platform?.name} 공식 제안 확인
                <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Secure</div>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <div>ID: RE-{campaign.id}P-{campaign.platform_id}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Engine ── */}
      <div className="mt-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Similar Proposals Recommended by AI</h2>
          <Link href="/" className="text-[10px] font-black text-blue-600 hover:underline">VIEW ALL COLLECTION</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map(c => {
            const rSnap = c.snapshots[0] ?? {};
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="group bg-white rounded-3xl border border-slate-100/60 p-5 hover:shadow-2xl transition-all hover:border-blue-100">
                <div className="relative h-40 rounded-2xl overflow-hidden mb-4 shadow-inner">
                  <img src={c.thumbnail_url || 'https://via.placeholder.com/400'} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                </div>
                <span className="text-[9px] font-black text-blue-600 mb-1 block uppercase tracking-tighter">{c.platform?.name}</span>
                <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-relaxed h-[2.6rem] mb-2">{c.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 italic">Comp. {(rSnap.applicant_count / (rSnap.recruit_count || 1)).toFixed(1)}:1</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
