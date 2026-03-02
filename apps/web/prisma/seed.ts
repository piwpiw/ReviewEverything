import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Start seeding...")

    // 1. Create Admin User
    const user = await prisma.user.upsert({
        where: { email: 'manager@piwpiw.com' },
        update: {},
        create: {
            email: 'manager@piwpiw.com',
            nickname: 'piwpiw_admin',
        },
    });

    console.log(`Created admin user: ${user.email}`)

    // 2. Clear existing platforms & campaigns for clean test data
    await prisma.platform.deleteMany({});

    const platforms = [
        { id: 1, name: 'Revu', base_url: 'https://revu.net' },
        { id: 2, name: 'Reviewnote', base_url: 'https://reviewnote.co.kr' },
        { id: 3, name: 'DinnerQueen', base_url: 'https://dinnerqueen.net' },
        { id: 4, name: 'ReviewPlace', base_url: 'https://reviewplace.co.kr' },
        { id: 5, name: 'Seouloppa', base_url: 'https://www.seouloppa.com' },
        { id: 6, name: 'MrBlog', base_url: 'https://mrblog.net' },
        { id: 7, name: 'GangnamFood', base_url: 'https://gangnamfood.com' }
    ];

    for (const p of platforms) {
        await prisma.platform.create({
            data: {
                id: p.id,
                name: p.name,
                base_url: p.base_url,
                is_active: true
            }
        });
    }

    console.log("Created platforms.");

    // 3. Create Campaigns
    const sampleCampaigns = [
        {
            platform_id: 1,
            original_id: 'revu-001',
            title: '[서울 강남] 최고급 한우 오마카세 2인 체험권',
            campaign_type: 'VST',
            media_type: 'BP',
            category: '음식',
            region_depth1: '서울',
            region_depth2: '강남',
            location: '서울 서초구 서초대로 123',
            reward_value: 120000,
            url: 'https://revu.net/campaign/1',
            recruit_count: 5,
            applicant_count: 150,
            competition_rate: 30.0,
            apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) // +3 days
        },
        {
            platform_id: 2,
            original_id: 'rn-001',
            title: '[택배] 프리미엄 수분 크림 세트 (10만원 상당)',
            campaign_type: 'SHP',
            media_type: 'IP',
            category: '뷰티',
            reward_value: 100000,
            url: 'https://reviewnote.co.kr/campaign/1',
            recruit_count: 20,
            applicant_count: 25,
            competition_rate: 1.25,
            apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1) // +1 days (Urgent)
        },
        {
            platform_id: 3,
            original_id: 'dq-001',
            title: '[부산 해운대] 오션뷰 호텔 1박 숙박권',
            campaign_type: 'VST',
            media_type: 'BP',
            category: '숙박',
            region_depth1: '부산',
            region_depth2: '해운대',
            reward_value: 250000,
            url: 'https://dinnerqueen.net/campaign/1',
            recruit_count: 2,
            applicant_count: 120,
            competition_rate: 60.0,
            apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // +7 days
        },
        {
            platform_id: 4,
            original_id: 'rp-001',
            title: '[원고료 지급] 스마트폰 신제품 리뷰 (원고료 5만원)',
            campaign_type: 'PRS',
            media_type: 'IP',
            category: '디지털',
            reward_value: 50000,
            url: 'https://reviewplace.co.kr/campaign/1',
            recruit_count: 50,
            applicant_count: 60,
            competition_rate: 1.2,
            apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) // +5 days
        }
    ];

    for (const c of sampleCampaigns) {
        await prisma.campaign.create({ data: c });
    }

    const dbCampaigns = await prisma.campaign.findMany();
    console.log(`Created ${dbCampaigns.length} sample campaigns.`);

    // 4. Create User Schedules
    await prisma.userSchedule.deleteMany({});
    const schedules = [
        {
            user_id: user.id,
            campaign_id: dbCampaigns[0].id,
            custom_title: '강남 오마카세 방문',
            status: 'SCHEDULED',
            visit_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
            sponsorship_value: 120000,
            ad_fee: 0,
            memo: '꼭 카메라 렌즈 챙기기'
        },
        {
            user_id: user.id,
            campaign_id: dbCampaigns[1].id,
            custom_title: '수분크림 리뷰 완료하기',
            status: 'PENDING',
            deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
            sponsorship_value: 100000,
            ad_fee: 20000,
        },
        {
            user_id: user.id,
            campaign_id: dbCampaigns[3].id,
            status: 'COMPLETED',
            deadline_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
            sponsorship_value: 0,
            ad_fee: 50000,
        }
    ];

    for (const s of schedules) {
        await prisma.userSchedule.create({ data: s });
    }

    console.log("Created test schedules.");

    // 5. Create Dummy Ingest Runs
    await prisma.ingestRun.deleteMany({});
    await prisma.ingestRun.createMany({
        data: [
            { platform_id: 1, status: 'SUCCESS', records_added: 120, records_updated: 50, start_time: new Date(Date.now() - 3600000), end_time: new Date() },
            { platform_id: 2, status: 'FAILED', records_added: 0, error_log: 'Connection Timeout', start_time: new Date(Date.now() - 7200000), end_time: new Date(Date.now() - 7100000) },
            { platform_id: 3, status: 'SUCCESS', records_added: 45, records_updated: 10, start_time: new Date(Date.now() - 1200000), end_time: new Date() }
        ]
    });
    console.log("Created mock ingest runs for admin dashboard.");

    console.log("Seeding completed successfully!")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
