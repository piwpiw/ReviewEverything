"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Crown, Moon, RefreshCw, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type ChannelConfig = { configured: boolean; reason: string };
type ChannelState = {
  kakao: ChannelConfig;
  telegram: ChannelConfig;
  push: ChannelConfig;
};
type ChannelKey = "kakao" | "telegram" | "push";

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ChannelStatusHint({ label, configured, reason }: { label: string; configured: boolean; reason: string }) {
  if (configured) return null;
  return (
    <p className="mt-2 rounded-lg border border-amber-300/40 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
      <span className="font-black">{label}</span> 채널 설정이 필요합니다. {reason ? `사유: ${reason}` : ""}
    </p>
  );
}

function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number.parseInt(searchParams.get("userId") || "1", 10);
  const safeUserId = Number.isInteger(userId) && userId > 0 ? userId : 1;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [kakaoEnabled, setKakaoEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(true);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("07:00");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<ChannelKey | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [channelConfigured, setChannelConfigured] = useState<ChannelState>({
    kakao: { configured: false, reason: "" },
    telegram: { configured: false, reason: "" },
    push: { configured: false, reason: "" },
  });

  const isBusy = saving || testing !== null;

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.08 } },
    }),
    [],
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0 },
    }),
    [],
  );

  const channelLabel: Record<ChannelKey, string> = {
    kakao: "카카오톡",
    telegram: "텔레그램",
    push: "푸시",
  };

  const loadSettings = useCallback(async () => {
    if (!Number.isInteger(safeUserId)) return;
    setLoadingConfig(true);
    setError("");
    try {
      const [preferencesRes, channelsRes] = await Promise.all([
        fetch(`/api/me/notification-preferences?userId=${safeUserId}`),
        fetch("/api/me/notification-channels"),
      ]);

      if (preferencesRes.ok) {
        const data = await preferencesRes.json();
        setKakaoEnabled(Boolean(data.notify_kakao_enabled));
        setPushEnabled(Boolean(data.notify_push_enabled));
        setTelegramEnabled(Boolean(data.notify_telegram_enabled));
      }

      if (channelsRes.ok) {
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
      } else {
        setError("채널 상태 조회에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("설정 조회 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoadingConfig(false);
    }
  }, [safeUserId]);

  const savePreference = async (next: { kakao?: boolean; push?: boolean; telegram?: boolean }) => {
    if (!Number.isInteger(safeUserId)) {
      setError("유효한 사용자 ID를 찾지 못했습니다.");
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
          userId: safeUserId,
          notify_kakao_enabled: next.kakao,
          notify_push_enabled: next.push,
          notify_telegram_enabled: next.telegram,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error || "설정 변경 요청에 실패했습니다.");
      } else {
        setStatusMessage("설정이 저장되었습니다.");
      }
    } catch {
      setError("설정 변경 요청에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const testChannel = async (channel: ChannelKey) => {
    if (!Number.isInteger(safeUserId)) {
      setError("유효한 사용자 ID를 찾지 못했습니다.");
      return;
    }

    if (!channelConfigured[channel].configured) {
      setError(`${channelLabel[channel]} 채널 설정이 필요합니다. ${channelConfigured[channel].reason}`);
      return;
    }

    setTesting(channel);
    setError("");
    setStatusMessage("");

    try {
      const res = await fetch("/api/me/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: safeUserId,
          channel,
          dryRun: true,
          message: `${channelLabel[channel]} 채널 테스트 메시지입니다.`,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        detail?: string;
        error?: string;
      };

      if (!res.ok || json.success === false) {
        setError(`${channelLabel[channel]} 테스트 실패: ${json.error || json.detail || "원인 미상"}`);
        return;
      }

      setStatusMessage(`${channelLabel[channel]} 테스트가 완료되었습니다. ${json.detail || "전송 로그를 확인해 주세요."}`);
    } catch {
      setError(`${channelLabel[channel]} 테스트 요청에 실패했습니다.`);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="이전 페이지로 이동"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-black truncate">알림 설정</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">채널 연결 상태와 테스트를 한 화면에서 관리합니다.</p>
            </div>
          </div>
          <Link
            href={`/me?userId=${safeUserId}`}
            className="shrink-0 text-xs font-black px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            내 대시보드
          </Link>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5"
      >
        {error ? (
          <div className="rounded-xl border border-rose-300/50 dark:border-rose-700/40 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-xl border border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
            {statusMessage}
          </div>
        ) : null}

        <section className="sr-only">
          <h2>알림 설정 개요</h2>
        </section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-base font-black inline-flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              연결 채널 상태
            </h2>
            <button
              onClick={() => void loadSettings()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? "animate-spin" : ""}`} />
              설정 다시 조회
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
            status: channel-check · 미연결 상태는 fallback 알림 경로를 사용합니다.
          </p>
          {loadingConfig ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(["kakao", "telegram", "push"] as const).map((channel) => (
                <article key={channel} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">{channelLabel[channel]}</p>
                  <p className={`mt-1 font-black ${channelConfigured[channel].configured ? "text-emerald-500" : "text-rose-500"}`}>
                    {channelConfigured[channel].configured ? "연결됨" : "연결 필요"}
                  </p>
                  {channelConfigured[channel].reason ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{channelConfigured[channel].reason}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">
            아직 표시할 개인화 추천 채널이 없습니다. 채널 연결 후 다시 시도하세요.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black">카카오톡 알림</h2>
            </div>
            <Toggle
              checked={kakaoEnabled}
              disabled={isBusy}
              onChange={(checked) => {
                if (checked && !channelConfigured.kakao.configured) {
                  setKakaoEnabled(false);
                  setError(`카카오톡 채널 설정이 필요합니다. ${channelConfigured.kakao.reason}`);
                  return;
                }
                setKakaoEnabled(checked);
                void savePreference({ kakao: checked });
              }}
            />
          </div>
          <div className="px-4 pb-4">
            <ChannelStatusHint label="카카오톡" configured={channelConfigured.kakao.configured} reason={channelConfigured.kakao.reason} />
            <button
              onClick={() => void testChannel("kakao")}
              disabled={isBusy || !channelConfigured.kakao.configured}
              className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {testing === "kakao" ? "테스트 중..." : "카카오톡 테스트"}
            </button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-black">텔레그램 알림</h2>
            </div>
            <Toggle
              checked={telegramEnabled}
              disabled={isBusy}
              onChange={(checked) => {
                if (checked && !channelConfigured.telegram.configured) {
                  setTelegramEnabled(false);
                  setError(`텔레그램 채널 설정이 필요합니다. ${channelConfigured.telegram.reason}`);
                  return;
                }
                setTelegramEnabled(checked);
                void savePreference({ telegram: checked });
              }}
            />
          </div>
          <div className="px-4 pb-4">
            <ChannelStatusHint
              label="텔레그램"
              configured={channelConfigured.telegram.configured}
              reason={channelConfigured.telegram.reason}
            />
            <button
              onClick={() => void testChannel("telegram")}
              disabled={isBusy || !channelConfigured.telegram.configured}
              className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {testing === "telegram" ? "테스트 중..." : "텔레그램 테스트"}
            </button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black">푸시 알림</h2>
            </div>
            <Toggle
              checked={pushEnabled}
              disabled={isBusy}
              onChange={(checked) => {
                if (checked && !channelConfigured.push.configured) {
                  setPushEnabled(false);
                  setError(`푸시 채널 설정이 필요합니다. ${channelConfigured.push.reason}`);
                  return;
                }
                setPushEnabled(checked);
                void savePreference({ push: checked });
              }}
            />
          </div>
          <div className="px-4 pb-4">
            <ChannelStatusHint label="푸시" configured={channelConfigured.push.configured} reason={channelConfigured.push.reason} />
            <button
              onClick={() => void testChannel("push")}
              disabled={isBusy || !channelConfigured.push.configured}
              className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {testing === "push" ? "테스트 중..." : "푸시 테스트"}
            </button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-black inline-flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            방해 금지 설정
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">야간 시간에는 알림 빈도를 낮춰 운영 피로도를 줄입니다.</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-black">방해 금지 모드</span>
            <Toggle checked={dndEnabled} disabled={isBusy} onChange={setDndEnabled} />
          </div>
          {dndEnabled ? (
            <div className="mt-3 flex items-center gap-3">
              <select
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option>22:00</option>
                <option>23:00</option>
              </select>
              <span className="text-xs text-slate-500">~</span>
              <select
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option>06:00</option>
                <option>07:00</option>
                <option>08:00</option>
              </select>
            </div>
          ) : null}
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-black">운영 메모</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
            status: preference-ready · 설정 저장 후 실패 로그가 보이면 알림 이력에서 fallback 전송 경로를 점검하세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/me/notifications?userId=${safeUserId}`}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              알림 이력 보기
            </Link>
            <a
              href={`/me/settings?userId=${safeUserId}&retry=1`}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              설정 다시 시도
            </a>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}

export default function SettingsPageRoute() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <p className="text-xs text-slate-500 dark:text-slate-400">loading settings...</p>
          </div>
        </main>
      }
    >
      <SettingsPage />
    </Suspense>
  );
}
