import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { plan, source } = body;

    // In production, this would create a Toss Payments session
    // For now, return a redirect URL to Toss
    console.log(`PRO upgrade intent: plan=${plan}, source=${source}`);

    return NextResponse.json({
        success: true,
        message: "upgrade_intent_recorded",
        // Real Toss redirect URL would go here
        redirectUrl: "https://toss.im/transfer/link",
    });
}

export async function GET() {
    return NextResponse.json({
        plans: [
            {
                id: "starter",
                name: "스타터",
                price: 9900,
                period: "월",
                features: ["광역 필터링", "D-Day 알림 5건", "기본 통계"],
            },
            {
                id: "pro",
                name: "PRO",
                price: 19900,
                period: "월",
                features: ["전국 단위 캠페인 우선 매칭", "실시간 알림 무제한", "캘린더 동기화", "AI 당첨 예측"],
                popular: true,
            },
        ],
    });
}
