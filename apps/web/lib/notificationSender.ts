export type DeliveryChannel = 'push' | 'kakao';

export const KNOWN_CHANNELS = ['push', 'kakao'] as const;

export interface NotificationPayload {
  userId: number;
  scheduleId: number | null;
  message: string;
}

export interface DeliveryResult {
  ok: boolean;
  detail?: string;
}

export function normalizeDeliveryChannel(input: unknown): DeliveryChannel | null {
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toLowerCase();
  if (KNOWN_CHANNELS.includes(normalized as DeliveryChannel)) {
    return normalized as DeliveryChannel;
  }
  return null;
}

export async function dispatchNotification(channel: DeliveryChannel, payload: NotificationPayload): Promise<DeliveryResult> {
  const providers: Record<DeliveryChannel, () => Promise<DeliveryResult>> = {
    push: () => pushProvider(payload),
    kakao: () => kakaoProvider(payload),
  };

  const send = providers[channel] ?? providers.push;
  const result = await send();

  if (!result.ok && channel === 'push' && process.env.PUSH_ENDPOINT) {
    console.error(`[push-provider-error] user=${payload.userId} schedule=${payload.scheduleId} detail=${result.detail}`);
  }

  return result;
}

async function pushProvider(payload: NotificationPayload): Promise<DeliveryResult> {
  const endpoint = process.env.PUSH_ENDPOINT;

  if (!endpoint) {
    console.log(`[push-stub] user=${payload.userId} schedule=${payload.scheduleId} msg=${payload.message}`);
    return { ok: true, detail: 'push-stub' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, detail: `http_${response.status}:${text}` };
  }

  return { ok: true, detail: 'push-http-ok' };
}

async function kakaoProvider(payload: NotificationPayload): Promise<DeliveryResult> {
  if (!process.env.KAKAO_CHANNEL_KEY) {
    console.log(`[kakao-stub] user=${payload.userId} schedule=${payload.scheduleId} msg=${payload.message}`);
    return { ok: true, detail: 'kakao-stub' };
  }

  const endpoint = process.env.KAKAO_ENDPOINT || `${process.env.KAKAO_API_BASE || 'https://api.example.com'}/send`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KAKAO_CHANNEL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: 'kakao',
      userId: payload.userId,
      scheduleId: payload.scheduleId,
      message: payload.message,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, detail: `kakao_${response.status}:${text}` };
  }

  return { ok: true, detail: 'kakao-http-ok' };
}
