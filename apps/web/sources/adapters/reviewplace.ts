import { IPlatformAdapter, ScrapedCampaign } from "../types";

export class ReviewPlaceAdapter implements IPlatformAdapter {
    platformId = 4; baseUrl = "https://www.reviewplace.co.kr";
    async fetchList(page: number): Promise<ScrapedCampaign[]> { return []; }
}
