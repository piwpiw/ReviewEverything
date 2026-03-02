import { RevuAdapter } from "./sources/adapters/revu";
import { ReviewnoteAdapter } from "./sources/adapters/reviewnote";
import { DinnerQueenAdapter } from "./sources/adapters/dinnerqueen";
import { ReviewPlaceAdapter } from "./sources/adapters/reviewplace";
import { SeouloppaAdapter } from "./sources/adapters/seouloppa";
import { MrBlogAdapter } from "./sources/adapters/mrblog";
import { GangnamFoodAdapter } from "./sources/adapters/gangnamfood";

async function test() {
    const adapters = [
        { name: "Revu", adapter: new RevuAdapter() },
        { name: "Reviewnote", adapter: new ReviewnoteAdapter() },
        { name: "DinnerQueen", adapter: new DinnerQueenAdapter() },
        { name: "ReviewPlace", adapter: new ReviewPlaceAdapter() },
        { name: "SeoulOppa", adapter: new SeouloppaAdapter() },
        { name: "MrBlog", adapter: new MrBlogAdapter() },
        { name: "GangnamFood", adapter: new GangnamFoodAdapter() },
    ];

    for (const { name, adapter } of adapters) {
        console.log(`\n===== Testing ${name} =====`);
        try {
            const data = await adapter.fetchList(1);
            console.log(`${name}: ${data.length} items`);
            if (data.length > 0) {
                const first = data[0];
                console.log(`  First: ${first.title.substring(0, 60)}`);
                console.log(`  Type: ${first.campaign_type} | Media: ${first.media_type} | Loc: ${first.location}`);
                console.log(`  Reward: ${first.reward_text?.substring(0, 50)}`);
                console.log(`  URL: ${first.url}`);
                console.log(`  Recruit: ${first.recruit_count} | Applicants: ${first.applicant_count}`);
                // Check if it's a fallback
                if (first.original_id.includes("sample")) {
                    console.log(`  ⚠️ FALLBACK DATA (not real scraping)`);
                }
            }
        } catch (e: any) {
            console.log(`${name}: ERROR - ${e.message}`);
        }
    }
}

test().catch(console.error);
