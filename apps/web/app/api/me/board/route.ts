import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Premium Mock Dashboard Engine
    const mockData = {
        summary: {
            totalSponsorshipValue: 4250000,
            totalAdFee: 1250000,
            totalCampaigns: 18
        },
        month: "2026-03",
        schedules: [
            { id: 1, custom_title: "성수동 카페 오마카세 체험", visit_date: "2026-03-05", status: "SCHEDULED" },
            { id: 2, custom_title: "청담동 프리미엄 헤어숍", visit_date: "2026-03-08", status: "PENDING" },
            { id: 3, custom_title: "강남역 스테이크 하우스", visit_date: "2026-03-12", status: "COMPLETED" },
        ],
        notifications: [
            { id: 1, message: "축하합니다! 레뷰 캠페인에 선발되었습니다.", status: "WIN" },
            { id: 2, message: "오늘 마감되는 캠페인 5건이 있습니다.", status: "URGENT" },
            { id: 3, message: "회원님의 주간 분석 리포트가 발행되었습니다.", status: "REPORT" },
        ]
    };

    return NextResponse.json(mockData);
}
