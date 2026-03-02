import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";
import {
  absoluteUrl,
  DEFAULT_APPLICANT_COUNT,
  DEFAULT_DDAY_DAYS,
  DEFAULT_RECRUIT_COUNT,
  parseIntSafe,
  sleep,
} from "./_shared";

export class ReviewnoteAdapter implements IPlatformAdapter {
  platformId = 2;
  baseUrl = "https://www.reviewnote.co.kr";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[Reviewnote] Page ${page}`);
    await sleep(1200 + Math.random() * 800);

    try {
      const { data } = await fetchWithRetry(
        `${this.baseUrl}/campaigns?page=${page}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          },
        },
      );

      const $ = cheerio.load(String(data || ""));
      const nextData = $("#__NEXT_DATA__").html();
      if (!nextData) {
        console.warn("[Reviewnote] No __NEXT_DATA__ found.");
        return [];
      }

      const json = JSON.parse(nextData);
      const items = json?.props?.pageProps?.data?.objects || [];
      if (!items.length) return [];

      const campaigns: ScrapedCampaign[] = [];

      for (const item of items) {
        if (!item) continue;
        const title = String(item?.title || "").trim();
        if (!title || !item?.id) continue;

        const campaignType = item?.sort === "VISIT" ? "VST" : "SHP";
        let mediaType: "BP" | "IP" | "YP" = "BP";
        if (item?.channel === "INSTAGRAM") mediaType = "IP";
        else if (item?.channel === "YOUTUBE") mediaType = "YP";

        const loc = String(item?.sido?.name || item?.city || "Seoul").trim();
        const imgKey = encodeURIComponent(String(item?.imageKey || ""));
        const thumb = imgKey
          ? `https://firebasestorage.googleapis.com/v0/b/reviewnote-e92d9.appspot.com/o/${imgKey}?alt=media`
          : "";

        campaigns.push({
          original_id: `rn_${item.id}`,
          title: item?.sido?.name ? `[${item.sido.name}] ${title}` : title,
          campaign_type: campaignType,
          media_type: mediaType,
          location: loc,
          reward_text: String(item?.offer || "보상 정보 없음"),
          thumbnail_url: thumb || undefined,
          url: absoluteUrl(this.baseUrl, `/campaigns/${item.id}`),
          apply_end_date: item?.applyEndAt ? new Date(item.applyEndAt) : new Date(Date.now() + 86400000 * DEFAULT_DDAY_DAYS),
          recruit_count: parseIntSafe(String(item?.infNum || ""), DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(String(item?.applicantCount || ""), DEFAULT_APPLICANT_COUNT),
          brief_desc: String(item?.offer || "").split('\n')[0].trim(),
          tags: [item?.category?.name, item?.channel, item?.sort].filter(Boolean).join(" "),
        });
      }

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Reviewnote] Page ${page} failed:`, message);
      return [];
    }
  }
}

