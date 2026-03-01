import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');

    // Premium Mock Dashboard Engine
    const mockData = {
        summary: {
            totalSponsorshipValue: 4250000,
            totalAdFee: 1250000,
            totalCampaigns: 18
        },
        month: `${y}-${m}`,
        monthly: [
            { month: 1, sponsorship: 1000000, ad_fee: 300000, total: 1300000, count: 5 },
            { month: 2, sponsorship: 1500000, ad_fee: 500000, total: 2000000, count: 8 },
            { month: 3, sponsorship: 1750000, ad_fee: 450000, total: 2200000, count: 5 },
            { month: 4, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
            { month: 5, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
            { month: 6, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
        ],
        schedules: [
            { id: 1, custom_title: "성수동 카페 오마카세 체험", visit_date: `${y}-${m}-${String(today.getDate() + 2).padStart(2, '0')}`, status: "SCHEDULED" },
            { id: 2, custom_title: "청담동 프리미엄 헤어숍", visit_date: `${y}-${m}-${String(today.getDate() + 5).padStart(2, '0')}`, status: "PENDING" },
            { id: 3, custom_title: "강남역 스테이크 하우스", visit_date: `${y}-${m}-${String(Math.min(today.getDate() + 10, 28)).padStart(2, '0')}`, status: "COMPLETED" },
            { id: 4, custom_title: "홍대 수제 맥주 펍", visit_date: `${y}-${m}-${String(today.getDate() + 1).padStart(2, '0')}`, status: "URGENT" },
        ],
        notifications: [
            { id: 1, message: "축하합니다! 레뷰 캠페인에 선발되었습니다.", status: "WIN" },
            { id: 2, message: "오늘 마감되는 캠페인 5건이 있습니다.", status: "URGENT" },
            { id: 3, message: "회원님의 주간 분석 리포트가 발행되었습니다.", status: "REPORT" },
        ]
    };

    return NextResponse.json(mockData);
}
