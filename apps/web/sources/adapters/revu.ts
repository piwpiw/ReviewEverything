import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import {
  absoluteUrl,
  DEFAULT_APPLICANT_COUNT,
  DEFAULT_DDAY_DAYS,
  DEFAULT_RECRUIT_COUNT,
  parseIntSafe,
  sleep,
} from "./_shared";

export class RevuAdapter implements IPlatformAdapter {
  platformId = 1;
  baseUrl = "https://www.revu.net";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[Revu] Page ${page}`);
    await sleep(800 + Math.random() * 400);

    try {
      if (page === 1) {
        return this.fetchEndpoint("trending");
      }
      if (page === 2) {
        return this.fetchEndpoint("upcoming");
      }
      return [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Revu] Page ${page} failed:`, message);
      return [];
    }
  }

  private async fetchEndpoint(type: "trending" | "upcoming"): Promise<ScrapedCampaign[]> {
    const apiUrl = type === "trending"
      ? "https://api.weble.net/v1/campaigns/trending"
      : "https://api.weble.net/v1/campaigns/upcoming";

    const { data } = await fetchWithRetry(
      apiUrl,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Origin": "https://www.revu.net",
          "Referer": "https://www.revu.net/",
        },
      },
    );

    const items: unknown[] = (data as { items?: unknown[] })?.items || [];
    if (!items.length) {
      console.warn(`[Revu] No items from ${type} endpoint.`);
      return [];
    }

    const campaigns: ScrapedCampaign[] = [];

    for (const rawItem of items) {
      const item = rawItem as Record<string, unknown>;
      const title = String(item?.item || item?.title || "").trim();
      const id = item?.id;
      if (!title || !id) continue;

      const mediaRaw = String(item?.media || "").toLowerCase();
      const mediaType: ScrapedCampaign["media_type"] =
        mediaRaw.includes("instagram") || mediaRaw.includes("insta")
          ? "IP"
          : mediaRaw.includes("youtube")
            ? "YP"
            : mediaRaw.includes("blog")
              ? "BP"
              : mediaRaw.includes("clip")
                ? "CL"
                : mediaRaw.includes("reels")
                  ? "RS"
                  : mediaRaw.includes("shorts")
                    ? "SH"
                    : "BP";

      const categoryList = Array.isArray(item?.category)
        ? (item?.category as unknown[]).map((c) => String(c || ""))
        : [];
      const categories = categoryList.join(" ");
      const venue = (item?.venue && typeof item.venue === "object")
        ? (item.venue as Record<string, unknown>)
        : {};
      const location = venue?.addressFirst
        ? String(venue.addressFirst).split(" ").slice(0, 2).join(" ")
        : (Array.isArray(item?.localTag) && item.localTag.length
          ? String((item.localTag as unknown[])[0])
          : "Seoul");

      const campaignType: ScrapedCampaign["campaign_type"] =
        /review|reviewer|리뷰어|리뷰/.test(categories.toLowerCase())
          ? "PRS"
          : /visit|offlines|offline|in-store|오프라인|스토어|방문/.test(categories.toLowerCase())
            ? "VST"
            : "SHP";

      const campaignData = item?.campaignData && typeof item.campaignData === "object"
        ? (item.campaignData as Record<string, unknown>)
        : {};
      let rewardText = String(campaignData.reward || "").trim();
      if (campaignData.point && Number.isFinite(Number(campaignData.point))) {
        const pointValue = Number(campaignData.point);
        if (pointValue > 0) {
          rewardText = rewardText
            ? `${rewardText} + ${pointValue.toLocaleString()}P`
            : `${pointValue.toLocaleString()}P`;
        }
      }

      const byDeadline = parseIntSafe(String(item?.byDeadline || ""), DEFAULT_DDAY_DAYS);
      const applyEnd = item?.requestEndedOn
        ? new Date(`${item.requestEndedOn}T23:59:59+09:00`)
        : new Date(Date.now() + 86_400_000 * byDeadline);
      const stats = item?.campaignStats && typeof item.campaignStats === "object"
        ? (item.campaignStats as Record<string, unknown>)
        : {};

      campaigns.push({
        original_id: `rv_${id}`,
        title,
        campaign_type: campaignType,
        media_type: mediaType,
        location,
        reward_text: rewardText || "보상 정보 없음",
        thumbnail_url: item?.thumbnail
          ? String(item.thumbnail)
          : item?.contentImage
            ? String(item.contentImage)
            : undefined,
        url: absoluteUrl(this.baseUrl, `/campaign/${id}`),
        shop_url: undefined,
        lat: venue?.lat ? parseFloat(String(venue.lat)) : undefined,
        lng: venue?.lng ? parseFloat(String(venue.lng)) : undefined,
        apply_end_date: applyEnd,
        recruit_count: parseIntSafe(String(item?.reviewerLimit || ""), DEFAULT_RECRUIT_COUNT),
        applicant_count: parseIntSafe(String(stats?.requestCount || ""), DEFAULT_APPLICANT_COUNT),
        brief_desc: rewardText.split("+")[0].trim(),
        tags: categories,
      });
    }

    return campaigns;
  }
}

