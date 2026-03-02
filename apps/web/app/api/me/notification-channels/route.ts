import { NextResponse } from "next/server";
import { isChannelConfigured, KNOWN_CHANNELS } from "@/lib/notificationSender";

function reason(channel: string) {
  if (channel === "kakao") {
    if (!process.env.KAKAO_CHANNEL_KEY) return "KAKAO_CHANNEL_KEY is missing";
    if (!process.env.KAKAO_ENDPOINT) return "KAKAO_ENDPOINT is missing";
    return null;
  }
  if (channel === "telegram") {
    if (!process.env.TELEGRAM_BOT_TOKEN) return "TELEGRAM_BOT_TOKEN is missing";
    if (!process.env.TELEGRAM_CHAT_ID) return "TELEGRAM_CHAT_ID is missing";
    return null;
  }
  if (channel === "push") {
    return process.env.PUSH_ENDPOINT ? null : "PUSH_ENDPOINT is missing";
  }
  return null;
}

export async function GET() {
  const channels = KNOWN_CHANNELS.map((channel) => {
    const configured = isChannelConfigured(channel);
    return {
      channel,
      configured,
      reason: configured ? null : reason(channel),
    };
  });

  return NextResponse.json({
    channels,
    meta: {
      hasAnyChannel: channels.some((c) => c.configured),
    },
  });
}
