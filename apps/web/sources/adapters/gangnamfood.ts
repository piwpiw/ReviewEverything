import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";
import {
  absoluteUrl,
  buildDdayDate,
  DEFAULT_APPLICANT_COUNT,
  DEFAULT_DDAY_DAYS,
  DEFAULT_RECRUIT_COUNT,
  parseDdayDays,
  parseIntSafe,
  pickText,
  sleep,
  normalizeText,
} from "./_shared";

export class GangnamFoodAdapter implements IPlatformAdapter {
  platformId = 7;
  baseUrl = "https://xn--939au0g4vj8sq.net";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[GangnamFood] Page ${page}`);
    await sleep(1000 + Math.random() * 500);

    try {
      const { data } = await fetchWithRetry(`${this.baseUrl}/list.php?page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" },
      });
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      $(".item").each((i, el) => {
        const $el = $(el);
        const title = normalizeText($el.find(".title").text() || $el.find("a").last().text());
        const href = $el.find("a[href^='/cp/']").attr("href") || "";
        if (!title || !href) return;

        const contentText = pickText($el);
        const location = pickText($el.find(".area, .loc, .location").first()) || "서울";
        const rewardText = pickText($el.find(".reward, .price").first()) || "보상 정보 없음";
        const recruitText = /모집\s*(\d+)/.exec(contentText)?.[1];
        const applicantText = /신청\s*(\d+)/.exec(contentText)?.[1];
        const ddayText = /D-?\s*(\d+)/i.exec(contentText)?.[1];
        const dday = parseDdayDays(ddayText ? `D-${ddayText}` : undefined, DEFAULT_DDAY_DAYS);

        campaigns.push({
          original_id: `gf_${href.split("?").shift()?.split("/").filter(Boolean).pop() ?? `${Date.now()}_${i}`}`,
          title,
          campaign_type: /샘플|배송|상품|구매/.test(contentText) ? "SHP" : "VST",
          media_type: /instagram|insta|youtube|shorts|블로그/.test(contentText.toLowerCase()) ? "IP" : "BP",
          location,
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, $el.find("img").first().attr("src") || ""),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: parseIntSafe(recruitText, DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(applicantText, DEFAULT_APPLICANT_COUNT),
          brief_desc: rewardText.substring(0, 30),
          tags: [location, /체험단|리뷰/.test(title) ? "리뷰형" : "홍보형"].filter(Boolean).join(" "),
        });
      });

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[GangnamFood] Page ${page} failed:`, message);
      return [];
    }
  }
}

