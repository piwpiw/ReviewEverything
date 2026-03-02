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
      // Use the AJAX endpoint found by the subagent
      const { data } = await fetchWithRetry(`${this.baseUrl}/theme/go/_list_cmp_tpl.php?rpage=${page}&row_num=28`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": `${this.baseUrl}/cp/`,
        },
      });

      // The AJAX response returns <li> fragments
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      $("li").each((i, el) => {
        const $el = $(el);
        // Selector for title link with class title to avoid empty text from image link
        const titleLink = $el.find("a.title, a[class*='title']").first();
        if (titleLink.length === 0) {
          // Fallback to text area link
          $el.find(".txtArea a").first();
        }

        const titleText = titleLink.text().trim() || $el.find(".txtArea .title").text().trim();
        const href = titleLink.attr("href") || $el.find("a").first().attr("href") || "";
        if (!titleText || !href) return;

        const txtArea = $el.find(".txtArea");
        const rewardText = pickText(txtArea.find(".info")) || pickText(txtArea.find(".reward")) || "보상 정보 없음";

        const countText = txtArea.find(".count, .stat").text(); // "신청 1 / 모집 5"
        const applicantMatch = /신청\s*([0-9,]+)/.exec(countText);
        const recruitMatch = /모집\s*([0-9,]+)/.exec(countText);

        const ddayText = txtArea.find(".time, .dday").text().trim();
        const dday = parseDdayDays(ddayText, DEFAULT_DDAY_DAYS);

        campaigns.push({
          original_id: `gf_${href.split("id=").pop() ?? `${Date.now()}_${i}`}`,
          title: titleText.replace(/\[[^\]]+\]/g, "").trim(), // Strip [Area] from title
          campaign_type: /샘플|배송|상품|구매/.test(rewardText) ? "SHP" : "VST",
          media_type: /instagram|insta|youtube|shorts|블로그/.test(titleText.toLowerCase()) ? "IP" : "BP",
          location: titleText.match(/\[([^\]]+)\]/)?.[1] || "서울",
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, $el.find("img").first().attr("src") || ""),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: parseIntSafe(recruitMatch?.[1]?.replace(/,/g, ""), DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(applicantMatch?.[1]?.replace(/,/g, ""), DEFAULT_APPLICANT_COUNT),
          brief_desc: rewardText.substring(0, 30),
          tags: [titleText.match(/\[([^\]]+)\]/)?.[1] || "서울", /체험단|리뷰/.test(titleText) ? "리뷰형" : "홍보형"].filter(Boolean).join(" "),
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
