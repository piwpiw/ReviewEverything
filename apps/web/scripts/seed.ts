import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS = [
    { name: "Revu", base_url: "https://www.revu.net" },
    { name: "Reviewnote", base_url: "https://www.reviewnote.co.kr" },
    { name: "DinnerQueen", base_url: "https://dinnerqueen.net" },
    { name: "ReviewPlace", base_url: "https://www.reviewplace.co.kr" },
    { name: "Seouloppa", base_url: "https://seouloppa.net" },
    { name: "MrBlog", base_url: "https://mrblog.net" },
    { name: "GangnamFood", base_url: "https://gangnamfood.net" },
];

const CATEGORIES = ["식음료", "뷰티", "쇼핑", "여행", "교육", "라이프", "반려동물"];
const REGIONS = [
    { name: "서울", depth2: ["강남구", "서초구", "송파구", "마포구", "성동구"], lat: 37.5665, lng: 126.978 },
    { name: "부산", depth2: ["해운대구", "부산진구", "수영구"], lat: 35.1796, lng: 129.0756 },
    { name: "인천", depth2: ["연수구", "남동구"], lat: 37.4563, lng: 126.7052 }
];

async function main() {
    console.log("Seeding platforms...");
    const platformMap: Record<string, number> = {};
    for (const plat of PLATFORMS) {
        const p = await prisma.platform.upsert({
            where: { name: plat.name },
            update: {},
            create: plat,
        });
        platformMap[plat.name] = p.id;
    }

    console.log("Seeding mock campaigns...");
    for (const platformName of Object.keys(platformMap)) {
        const platform_id = platformMap[platformName];
        
        for (let i = 1; i <= 20; i++) {
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
            const d2 = region.depth2[Math.floor(Math.random() * region.depth2.length)];
            const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const recruit = Math.floor(Math.random() * 20) + 1;
            const applicant = Math.floor(Math.random() * 100);
            
            await prisma.campaign.upsert({
                where: {
                    platform_id_original_id: {
                        platform_id,
                        original_id: `mock_${platformName}_${i}`
                    }
                },
                update: {},
                create: {
                    platform_id,
                    original_id: `mock_${platformName}_${i}`,
                    title: `[임시] ${region.name} ${d2} ${cat} 체험단 모집 ${i}`,
                    campaign_type: i % 2 === 0 ? "VST" : "SHP",
                    media_type: i % 3 === 0 ? "BP" : (i % 3 === 1 ? "IP" : "YP"),
                    category: cat,
                    region_depth1: region.name,
                    region_depth2: d2,
                    location: `${region.name} ${d2} 어딘가`,
                    lat: region.lat + (Math.random() - 0.5) * 0.1,
                    lng: region.lng + (Math.random() - 0.5) * 0.1,
                    reward_text: "무료 체험권 + 원고료",
                    reward_value: (Math.floor(Math.random() * 10) + 1) * 10000,
                    url: "https://example.com",
                    recruit_count: recruit,
                    applicant_count: applicant,
                    competition_rate: recruit > 0 ? applicant / recruit : 0,
                    apply_end_date: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
                }
            });
        }
    }
    console.log("Seeding complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
