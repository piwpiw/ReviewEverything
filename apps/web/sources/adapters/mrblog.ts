import { IPlatformAdapter, ScrapedCampaign } from "../types";

export class MrBlogAdapter implements IPlatformAdapter {
    platformId = 6; baseUrl = "https://mrblog.net";
    async fetchList(page: number): Promise<ScrapedCampaign[]> { return []; }
}
