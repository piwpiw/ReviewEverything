import { Prisma } from "@prisma/client";
import { buildKeywordAndFilters } from "@/lib/search/searchUtils";
import { getCategoryQueryClauses, parseSearchQuery } from "@/lib/search/queryEnhancer";

export function buildCampaignsQuery(searchParams: URLSearchParams) {
  const q = searchParams.get("q");
  const platform_id = searchParams.get("platform_id");
  const campaign_type = searchParams.get("campaign_type");
  const media_type = searchParams.get("media_type");
  const category = searchParams.get("category");
  const sub_category = searchParams.get("sub_category");
  const region_depth1 = searchParams.get("region_depth1");
  const region_depth2 = searchParams.get("region_depth2");

  const min_reward = searchParams.get("min_reward");
  const max_comp = searchParams.get("max_comp");
  const dday_limit = searchParams.get("dday");
  const max_deadline_days = searchParams.get("max_deadline_days");

  const sort = searchParams.get("sort") || "latest_desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  const where: Prisma.CampaignWhereInput = {};
  const andClauses: Prisma.CampaignWhereInput[] = [];

  if (q) {
    const parsed = parseSearchQuery(q);
    const queryTerms = parsed.keywordTokens.join(" ");
    const keywordClauses = queryTerms ? buildKeywordAndFilters(queryTerms) : [];
    const categoryClauses = getCategoryQueryClauses(parsed.categoryHints);

    if (keywordClauses.length > 0) {
      andClauses.push(...keywordClauses);
    }
    if (categoryClauses.length > 0) {
      andClauses.push({ OR: categoryClauses });
    }
    if (!parsed.hasOnlyRegion && queryTerms) {
      where.OR = [
        { title: { contains: queryTerms, mode: "insensitive" } },
        { location: { contains: queryTerms, mode: "insensitive" } },
        { category: { contains: queryTerms, mode: "insensitive" } },
        { reward_text: { contains: queryTerms, mode: "insensitive" } },
      ];
    }
    if (parsed.regionDepth1) where.region_depth1 = parsed.regionDepth1;
    if (parsed.regionDepth2) where.region_depth2 = parsed.regionDepth2;
  }

  if (platform_id) where.platform_id = parseInt(platform_id, 10);
  if (campaign_type) where.campaign_type = campaign_type;
  if (media_type) {
    if (media_type.includes(",")) where.media_type = { in: media_type.split(",") };
    else where.media_type = media_type;
  }
  if (category) where.category = category;
  if (sub_category) where.sub_category = sub_category;
  if (region_depth1) where.region_depth1 = region_depth1;
  if (region_depth2) where.region_depth2 = region_depth2;

  if (min_reward) where.reward_value = { gte: parseInt(min_reward, 10) };
  if (max_comp) where.competition_rate = { lte: parseFloat(max_comp) };
  if (dday_limit && !max_deadline_days) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(dday_limit, 10));
    where.apply_end_date = { gte: new Date(), lte: targetDate };
  }
  if (max_deadline_days) {
    const days = parseInt(max_deadline_days, 10);
    if (!isNaN(days) && days > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      where.apply_end_date = { gte: new Date(), lte: cutoff };
    }
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  let orderBy: Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[] = {
    created_at: "desc",
  };

  switch (sort) {
    case "deadline_asc":
      orderBy = [{ apply_end_date: { sort: "asc", nulls: "last" } }, { created_at: "desc" }];
      break;
    case "competition_asc":
      orderBy = [{ competition_rate: "asc" }, { created_at: "desc" }];
      break;
    case "competition_desc":
      orderBy = [{ competition_rate: "desc" }, { created_at: "desc" }];
      break;
    case "applicant_desc":
      orderBy = { applicant_count: "desc" };
      break;
    case "reward_desc":
      orderBy = { reward_value: "desc" };
      break;
    case "latest_desc":
    default:
      orderBy = { created_at: "desc" };
      break;
  }

  const skip = (page - 1) * limit;
  return { where, orderBy, skip, take: limit, page, limit, sort };
}

export { buildKeywordAndFilters } from "@/lib/search/searchUtils";
