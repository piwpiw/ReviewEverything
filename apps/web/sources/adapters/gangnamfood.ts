import { IPlatformAdapter, ScrapedCampaign } from "../types";

export class GangnamFoodAdapter implements IPlatformAdapter {
    platformId = 7; baseUrl = "https://gangnamfood.net";
    async fetchList(page: number): Promise<ScrapedCampaign[]> { return []; }
}
