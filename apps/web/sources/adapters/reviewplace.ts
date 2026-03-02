import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";
import { AnyNode } from "domhandler";
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

export class ReviewPlaceAdapter implements IPlatformAdapter {
  platformId = 4;
  baseUrl = "https://www.reviewplace.co.kr";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[ReviewPlace] Page ${page}`);
    await sleep(1500 + Math.random() * 500);

    try {
      const { data } = await fetchWithRetry(`${this.baseUrl}/pr/?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,*/*;q=0.9",
        },
      });

      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      const rows = [
        ...$(".campaign_list .item").toArray(),
        ...$(".campaign_list li").toArray(),
        ...$(".campaign-item").toArray(),
        ...$(".item-card").toArray(),
        ...$("article").toArray(),
        ...$(".list").toArray(),
      ];
      const unique = Array.from(new Set(rows));

      for (let i = 0; i < unique.length; i++) {
        if (i >= 30) break;
        const el = unique[i] as unknown as AnyNode;
        const $el = $(el);
        const fullText = pickText($el);
        if (!fullText) continue;

        const href = $el.find("a[href]").first().attr("href") || "";
        if (!href) continue;

        const imgEl = $el.find("img").first();
        const thumb = imgEl.attr("src") || imgEl.attr("data-src") || "";
        const titleText = normalizeText($el.find("h3, h4, .title, .subject").first().text());

        const titleMatch = /(?:\[[^\]]+\]\s*)?(.+?)\s+(?:D-?\s*\d+|D\s*-\s*\d+|Dday)/i.exec(fullText);
        const title = (titleText || titleMatch?.[1] || fullText.slice(0, 80)).trim();
        if (title.length < 4) continue;

        const locMatch = /\[([^\]]+)\]/.exec(fullText);
        const location = locMatch ? normalizeText(locMatch[1].replace(/\//g, " ")) : "Seoul";

        const rewardText = /([0-9,]+\s*만원|[0-9,]+\s*원|P$|포인트)/i.exec(fullText)?.[0] || "보상 정보 없음";
        const recruitText = /모집\s*([0-9,]+)/.exec(fullText)?.[1];
        const applicantText = /신청\s*([0-9,]+)/.exec(fullText)?.[1];
        const ddayText = /D\s*-\s*(\d+)/i.exec(fullText)?.[1];
        const dday = parseDdayDays(ddayText ? `D-${ddayText}` : undefined, DEFAULT_DDAY_DAYS);

        const isDelivery = /샘플|배송|구매|product|item|구입|구매형|샘플형/.test(fullText);
        const isVisit = /방문|오프라인|매장|스토어|현장/.test(fullText);

        const idMatch = /id=(\d+)/.exec(href) || /\/(\d+)(?:\/?$)/.exec(href);
        const id = idMatch?.[1] ?? `${Date.now()}_${i}`;

        campaigns.push({
          original_id: `rp_${id}`,
          title,
          campaign_type: isDelivery ? "SHP" : isVisit ? "VST" : "PRS",
          media_type: /instagram|insta|youtube|youtube|shorts|blog|블로그|sns/.test(fullText.toLowerCase()) ? "IP" : "BP",
          location,
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, thumb),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: parseIntSafe(recruitText, DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(applicantText, DEFAULT_APPLICANT_COUNT),
          brief_desc: fullText.split(' ').slice(0, 6).join(' '),
          tags: [location, isDelivery ? "배송형" : "방문형"].filter(Boolean).join(" "),
        });
      }

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[ReviewPlace] Page ${page} failed:`, message);
      return [];
    }
  }
}

