export type DeliveryChannel = "push" | "kakao" | "telegram";

export const KNOWN_CHANNELS = ["push", "kakao", "telegram"] as const;

export interface NotificationPayload {
  userId: number;
  scheduleId: number | null;
  message: string;
}

export interface DeliveryResult {
  ok: boolean;
  detail?: string;
}

export interface AttemptedDeliveryChannel {
  channel: DeliveryChannel;
  detail: string;
  ok: boolean;
}

export interface RetryDispatchResult {
  ok: boolean;
  finalChannel: DeliveryChannel;
  detail: string;
  attemptedChannels: AttemptedDeliveryChannel[];
}

export function normalizeDeliveryChannel(input: unknown): DeliveryChannel | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toLowerCase();
  if (KNOWN_CHANNELS.includes(normalized as DeliveryChannel)) {
    return normalized as DeliveryChannel;
  }
  return null;
}

export function isChannelConfigured(channel: DeliveryChannel) {
  if (channel === "push") return Boolean(process.env.PUSH_ENDPOINT);
  if (channel === "kakao") return Boolean(process.env.KAKAO_CHANNEL_KEY && process.env.KAKAO_ENDPOINT);
  if (channel === "telegram")
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  return false;
}

export function pickDeliveryChannelWithPreferences(preference: {
  kakao?: boolean | null;
  telegram?: boolean | null;
  push?: boolean | null;
}): DeliveryChannel | null {
  const enabledKakao = preference.kakao ?? true;
  const enabledTelegram = preference.telegram ?? false;
  const enabledPush = preference.push ?? true;

  if (enabledKakao && isChannelConfigured("kakao")) return "kakao";
  if (enabledTelegram && isChannelConfigured("telegram")) return "telegram";
  if (enabledPush && isChannelConfigured("push")) return "push";
  return null;
}

export function deliveryChannelsForRetry(primary: DeliveryChannel): DeliveryChannel[] {
  const seen = new Set<DeliveryChannel>();
  const ordered: DeliveryChannel[] = [primary, "kakao", "telegram", "push"];
  const result: DeliveryChannel[] = [];

  for (const channel of ordered) {
    if (!seen.has(channel)) {
      seen.add(channel);
      if (isChannelConfigured(channel) || channel === primary) {
        result.push(channel);
      }
    }
  }

  return result;
}

export async function dispatchNotification(channel: DeliveryChannel, payload: NotificationPayload): Promise<DeliveryResult> {
  const providers: Record<DeliveryChannel, () => Promise<DeliveryResult>> = {
    push: () => pushProvider(payload),
    kakao: () => kakaoProvider(payload),
    telegram: () => telegramProvider(payload),
  };

  const send = providers[channel] ?? providers.push;
  let result: DeliveryResult;
  try {
    result = await send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, detail: `${channel}_exception:${message}` };
  }

  if (!result.ok && channel === "push" && process.env.PUSH_ENDPOINT) {
    console.error(`[push-provider-error] user=${payload.userId} schedule=${payload.scheduleId} detail=${result.detail}`);
  }

  if (!result.ok && channel === "kakao" && process.env.KAKAO_CHANNEL_KEY) {
    console.error(`[kakao-provider-error] user=${payload.userId} schedule=${payload.scheduleId} detail=${result.detail}`);
  }

  if (!result.ok && channel === "telegram" && process.env.TELEGRAM_BOT_TOKEN) {
    console.error(`[telegram-provider-error] user=${payload.userId} schedule=${payload.scheduleId} detail=${result.detail}`);
  }

  return result;
}

export async function dispatchNotificationWithRetry(
  primaryChannel: DeliveryChannel,
  payload: NotificationPayload,
): Promise<RetryDispatchResult> {
  const channelsToTry = deliveryChannelsForRetry(primaryChannel);
  const attemptedChannels: AttemptedDeliveryChannel[] = [];
  let finalDetail = "notification send failed";
  let finalChannel: DeliveryChannel = primaryChannel;

  for (const retryChannel of channelsToTry) {
    const result = await dispatchNotification(retryChannel, payload);
    finalChannel = retryChannel;
    const detail = result.detail || (result.ok ? "ok" : "failed");
    attemptedChannels.push({
      channel: retryChannel,
      detail,
      ok: Boolean(result.ok),
    });

    if (result.ok) {
      return {
        ok: true,
        finalChannel: retryChannel,
        detail,
        attemptedChannels,
      };
    }

    if (result.detail) {
      finalDetail = result.detail;
    }
  }

  return {
    ok: false,
    finalChannel,
    detail: finalDetail,
    attemptedChannels,
  };
}

async function pushProvider(payload: NotificationPayload): Promise<DeliveryResult> {
  const endpoint = process.env.PUSH_ENDPOINT;

  if (!endpoint) {
    return { ok: false, detail: "push_endpoint_missing" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, detail: `http_${response.status}:${text}` };
  }

  return { ok: true, detail: "push-http-ok" };
}

async function kakaoProvider(payload: NotificationPayload): Promise<DeliveryResult> {
  if (!process.env.KAKAO_CHANNEL_KEY) {
    return { ok: false, detail: "kakao_channel_key_missing" };
  }
  if (!process.env.KAKAO_ENDPOINT) {
    return { ok: false, detail: "kakao_endpoint_missing" };
  }

  const endpoint = process.env.KAKAO_ENDPOINT;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KAKAO_CHANNEL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: "kakao",
      userId: payload.userId,
      scheduleId: payload.scheduleId,
      message: payload.message,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, detail: `kakao_${response.status}:${text}` };
  }

  return { ok: true, detail: "kakao-http-ok" };
}

async function telegramProvider(payload: NotificationPayload): Promise<DeliveryResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, detail: "telegram_bot_token_missing" };
  }

  const defaultChatId = process.env.TELEGRAM_CHAT_ID;
  if (!defaultChatId) {
    return { ok: false, detail: "telegram_chat_id_missing" };
  }

  const resolvedChatId = String(defaultChatId);
  if (!resolvedChatId) {
    return { ok: false, detail: "telegram_chat_id_missing" };
  }

  const endpoint = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
  const response = await fetch(`${endpoint}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: resolvedChatId,
      text: payload.message,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, detail: `telegram_${response.status}:${text}` };
  }

  return { ok: true, detail: "telegram-http-ok" };
}
