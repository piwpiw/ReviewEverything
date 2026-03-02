"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Crown, Moon, Send, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type ChannelConfig = { configured: boolean; reason: string };
type ChannelState = {
  kakao: ChannelConfig;
  telegram: ChannelConfig;
  push: ChannelConfig;
};

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-700/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ChannelStatusHint({ label, configured, reason }: { label: string; configured: boolean; reason: string }) {
  if (configured) return null;
  const message = reason ? `${label} 설정이 완료되지 않았습니다. ${reason}` : `${label} 설정이 완료되지 않았습니다.`;
  return (
    <p className="px-4 py-2 text-[11px] text-amber-200" title={message}>
      <span className="font-black">{label}</span>이(가) 설정되지 않았습니다.
      {reason ? ` 이유: ${reason}` : ""}
    </p>
  );
}

function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number.parseInt(searchParams.get("userId") || "1", 10);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [kakaoEnabled, setKakaoEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"kakao" | "telegram" | "push" | null>(null);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const isBusy = saving || testing !== null;
  const [channelConfigured, setChannelConfigured] = useState<ChannelState>({
    kakao: { configured: false, reason: "" },
    telegram: { configured: false, reason: "" },
    push: { configured: false, reason: "" },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const savePreference = async (next: { kakao?: boolean; push?: boolean; telegram?: boolean }) => {
    if (!Number.isInteger(userId)) {
      setError("사용자 ID가 유효하지 않습니다.");
      return;
    }
    setSaving(true);
    setError("");
    setStatusMessage("");
    try {
      const res = await fetch("/api/me/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          notify_kakao_enabled: next.kakao,
          notify_push_enabled: next.push,
          notify_telegram_enabled: next.telegram,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error || "알림 설정 저장에 실패했습니다.");
      } else {
        setStatusMessage("알림 설정이 저장되었습니다.");
      }
    } catch {
      setError("알림 설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const testChannel = async (channel: "kakao" | "telegram" | "push") => {
    if (!Number.isInteger(userId)) {
      setError("사용자 ID가 유효하지 않습니다.");
      return;
    }
    setTesting(channel);
    setError("");
    setStatusMessage("");

    if (!channelConfigured[channel].configured) {
      setError(`${channel}가 설정되지 않았습니다. ${channelConfigured[channel].reason}`);
      setTesting(null);
      return;
    }

    try {
      const res = await fetch("/api/me/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          channel,
          dryRun: true,
          message: `알림 채널 점검: ${channel}`,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        detail?: string;
        error?: string;
      };
      if (!res.ok || json.success === false) {
        setError(`${channel} 테스트 실패: ${json.error || json.detail || "알 수 없는 오류"}`);
        return;
      }
      setStatusMessage(`${channel} 테스트 성공 (상세: ${json.detail || "정상"})`);
    } catch {
      setError(`${channel} 테스트 실패.`);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [preferencesRes, channelsRes] = await Promise.all([
          fetch(`/api/me/notification-preferences?userId=${userId}`),
          fetch("/api/me/notification-channels"),
        ]);

        if (preferencesRes.ok) {
          const data = await preferencesRes.json();
          setKakaoEnabled(Boolean(data.notify_kakao_enabled));
          setPushEnabled(Boolean(data.notify_push_enabled));
          setTelegramEnabled(Boolean(data.notify_telegram_enabled));
        }

        if (!channelsRes.ok) return;
        const data = await channelsRes.json();
        const channels = Array.isArray(data.channels) ? data.channels : [];
        const kakao = channels.find((c: { channel: string }) => c.channel === "kakao");
        const telegram = channels.find((c: { channel: string }) => c.channel === "telegram");
        const push = channels.find((c: { channel: string }) => c.channel === "push");
        setChannelConfigured({
          kakao: {
            configured: Boolean(kakao?.configured),
            reason: typeof kakao?.reason === "string" ? kakao.reason : "",
          },
          telegram: {
            configured: Boolean(telegram?.configured),
            reason: typeof telegram?.reason === "string" ? telegram.reason : "",
          },
          push: {
            configured: Boolean(push?.configured),
            reason: typeof push?.reason === "string" ? push.reason : "",
          },
        });
      } catch {
        // ignore
      }
    };

    if (Number.isInteger(userId)) {
      load();
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">알림 설정</h1>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto p-4 sm:p-6 space-y-8 mt-4"
      >
        <motion.section variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2 mb-3">채널 연결 상태</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 p-3">
              <span className="block text-slate-400">카카오톡</span>
              <span className={`font-black ${channelConfigured.kakao.configured ? "text-emerald-300" : "text-rose-300"}`}>
                {channelConfigured.kakao.configured ? "사용 가능" : "미설정"}
              </span>
              {channelConfigured.kakao.reason ? <p className="text-slate-500 mt-1">{channelConfigured.kakao.reason}</p> : null}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <span className="block text-slate-400">텔레그램</span>
              <span className={`font-black ${channelConfigured.telegram.configured ? "text-emerald-300" : "text-rose-300"}`}>
                {channelConfigured.telegram.configured ? "사용 가능" : "미설정"}
              </span>
              {channelConfigured.telegram.reason ? <p className="text-slate-500 mt-1">{channelConfigured.telegram.reason}</p> : null}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <span className="block text-slate-400">푸시</span>
              <span className={`font-black ${channelConfigured.push.configured ? "text-emerald-300" : "text-rose-300"}`}>
                {channelConfigured.push.configured ? "사용 가능" : "미설정"}
              </span>
              {channelConfigured.push.reason ? <p className="text-slate-500 mt-1">{channelConfigured.push.reason}</p> : null}
            </div>
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-900 border border-blue-500/20 p-6">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">프리미엄 업그레이드</h2>
              </div>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                프리미엄 구독 시 우선 알림과 고급 자동화 설정을 이용할 수 있습니다.
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-blue-400">
                자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </div>
        </motion.div>

        <motion.section variants={itemVariants}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-4 mb-3">알림 채널</h3>
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FEE500]/10 flex items-center justify-center text-[#FEE500]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">카카오톡</div>
                  <div className="text-xs text-slate-400">D-3 / D-1 리마인더를 카카오톡으로 받습니다.</div>
                </div>
              </div>
              <Toggle
                checked={kakaoEnabled}
                disabled={isBusy}
                onChange={(checked) => {
                  if (checked && !channelConfigured.kakao.configured) {
                    setKakaoEnabled(false);
                    setError(`카카오톡이 설정되지 않았습니다. ${channelConfigured.kakao.reason}`);
                    return;
                  }
                  setKakaoEnabled(checked);
                  void savePreference({ kakao: checked });
                }}
              />
            </div>
            <ChannelStatusHint label="카카오톡" configured={channelConfigured.kakao.configured} reason={channelConfigured.kakao.reason} />
            <div className="px-4 pb-4">
              <button
                onClick={() => void testChannel("kakao")}
                disabled={isBusy || !channelConfigured.kakao.configured}
                className="px-3 py-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black disabled:opacity-40"
              >
                {testing === "kakao" ? "테스트 중..." : "테스트 전송"}
              </button>
            </div>

            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-300">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">텔레그램</div>
                  <div className="text-xs text-slate-400">D-3 / D-1 리마인더를 텔레그램으로 받습니다.</div>
                </div>
              </div>
              <Toggle
                checked={telegramEnabled}
                disabled={isBusy}
                onChange={(checked) => {
                  if (checked && !channelConfigured.telegram.configured) {
                    setTelegramEnabled(false);
                    setError(`텔레그램이 설정되지 않았습니다. ${channelConfigured.telegram.reason}`);
                    return;
                  }
                  setTelegramEnabled(checked);
                  void savePreference({ telegram: checked });
                }}
              />
            </div>
            <ChannelStatusHint label="텔레그램" configured={channelConfigured.telegram.configured} reason={channelConfigured.telegram.reason} />
            <div className="px-4 pb-4">
              <button
                onClick={() => void testChannel("telegram")}
                disabled={isBusy || !channelConfigured.telegram.configured}
                className="px-3 py-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black disabled:opacity-40"
              >
                    {testing === "telegram" ? "테스트 중..." : "테스트 전송"}
              </button>
            </div>

            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">푸시</div>
                  <div className="text-xs text-slate-400">웹훅/브라우저 푸시로 알림을 받습니다.</div>
                </div>
              </div>
              <Toggle
                checked={pushEnabled}
                disabled={isBusy}
                onChange={(checked) => {
                  if (checked && !channelConfigured.push.configured) {
                    setPushEnabled(false);
                    setError(`푸시가 설정되지 않았습니다. ${channelConfigured.push.reason}`);
                    return;
                  }
                  setPushEnabled(checked);
                  void savePreference({ push: checked });
                }}
              />
            </div>
            <ChannelStatusHint label="푸시" configured={channelConfigured.push.configured} reason={channelConfigured.push.reason} />
            <div className="px-4 pb-4">
              <button
                onClick={() => void testChannel("push")}
                disabled={isBusy || !channelConfigured.push.configured}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black disabled:opacity-40"
              >
                {testing === "push" ? "테스트 중..." : "테스트 전송"}
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
                  <span className="font-bold text-lg">@</span>
                </div>
                <div>
                  <div className="font-semibold text-white">이메일 (미연결)</div>
                  <div className="text-xs text-slate-400">향후 확장 예정입니다.</div>
                </div>
              </div>
            <Toggle checked={emailEnabled} disabled={isBusy} onChange={setEmailEnabled} />
            </div>

            <div className="px-4 pb-4 text-xs text-slate-400">
              {saving ? "저장 중..." : error || statusMessage || "알림 설정은 자동 동기화됩니다."}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-4 mb-3">운영 기능</h3>
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">방해 금지</div>
                  <div className="text-xs text-slate-400">선택한 시간 동안 알림 알림음을 정지합니다.</div>
                </div>
              </div>
              <Toggle checked={dndEnabled} disabled={isBusy} onChange={setDndEnabled} />
            </div>

            {dndEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-14 pr-2 flex items-center gap-4">
                <select className="bg-slate-800 text-sm text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                  <option>22:00</option>
                  <option>23:00</option>
                </select>
                <span className="text-slate-500">to</span>
                <select className="bg-slate-800 text-sm text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                  <option>07:00</option>
                  <option>08:00</option>
                </select>
              </motion.div>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-4 mb-3">자동화 상태</h3>
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 text-xs text-slate-400">
            <p>발송이 건너뛰면 채널 상태와 대체 동작이 발송 이력에 기록됩니다.</p>
            <p className="mt-2">매일 D-3 / D-1 알림 발송 시 카카오톡·텔레그램·푸시 대체 전송이 사용 가능합니다.</p>
          </div>
        </motion.section>

        <p className="text-center text-xs text-slate-500 mt-8">ReviewEverything v2.0 (BETA)</p>
      </motion.main>
    </div>
  );
}

export default function SettingsPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-200 p-4">로딩 중...</div>}>
      <SettingsPage />
    </Suspense>
  );
}
