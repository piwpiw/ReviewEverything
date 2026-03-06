import { PrismaClient } from "@prisma/client";
import { KUCOOK_TAXONOMY_SEEDS } from "./kucook-taxonomy";

const prisma = new PrismaClient() as PrismaClient & { [key: string]: any };

async function seedTaxonomy() {
  for (const term of KUCOOK_TAXONOMY_SEEDS.filter((item) => !item.parentSlug)) {
    await prisma.taxonomyTerm.upsert({
      where: { uniq_taxonomy_kind_slug: { kind: term.kind, slug: term.slug } },
      update: {
        name: term.name,
        icon_emoji: term.iconEmoji,
        icon_key: term.iconKey,
        badge_color: term.badgeColor,
        sort_order: term.sortOrder,
        description: term.description ?? null,
        aliases: term.aliases ?? undefined,
        depth: 0,
      },
      create: {
        kind: term.kind,
        name: term.name,
        slug: term.slug,
        icon_emoji: term.iconEmoji,
        icon_key: term.iconKey,
        badge_color: term.badgeColor,
        sort_order: term.sortOrder,
        description: term.description ?? null,
        aliases: term.aliases ?? undefined,
        depth: 0,
      },
    });
  }

  for (const term of KUCOOK_TAXONOMY_SEEDS.filter((item) => item.parentSlug)) {
    const parent = await prisma.taxonomyTerm.findFirstOrThrow({
      where: { slug: term.parentSlug, kind: term.kind },
    });

    await prisma.taxonomyTerm.upsert({
      where: { uniq_taxonomy_kind_slug: { kind: term.kind, slug: term.slug } },
      update: {
        name: term.name,
        icon_emoji: term.iconEmoji,
        icon_key: term.iconKey,
        badge_color: term.badgeColor,
        sort_order: term.sortOrder,
        parent_id: parent.id,
        description: term.description ?? null,
        aliases: term.aliases ?? undefined,
        depth: parent.depth + 1,
      },
      create: {
        kind: term.kind,
        name: term.name,
        slug: term.slug,
        icon_emoji: term.iconEmoji,
        icon_key: term.iconKey,
        badge_color: term.badgeColor,
        sort_order: term.sortOrder,
        parent_id: parent.id,
        description: term.description ?? null,
        aliases: term.aliases ?? undefined,
        depth: parent.depth + 1,
      },
    });
  }
}

async function assignDishTaxonomies(dishId: number, slugs: string[]) {
  for (const slug of slugs) {
    const term = await prisma.taxonomyTerm.findFirstOrThrow({ where: { slug } });
    await prisma.dishTaxonomyAssignment.upsert({
      where: { uniq_dish_taxonomy: { dish_id: dishId, taxonomy_term_id: term.id } },
      update: {
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
      create: {
        dish_id: dishId,
        taxonomy_term_id: term.id,
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
    });
  }
}

async function assignRestaurantTaxonomies(restaurantId: number, slugs: string[]) {
  for (const slug of slugs) {
    const term = await prisma.taxonomyTerm.findFirstOrThrow({ where: { slug } });
    await prisma.restaurantTaxonomyAssignment.upsert({
      where: { uniq_restaurant_taxonomy: { restaurant_id: restaurantId, taxonomy_term_id: term.id } },
      update: {
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
      create: {
        restaurant_id: restaurantId,
        taxonomy_term_id: term.id,
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
    });
  }
}

async function assignChefTaxonomies(chefId: number, slugs: string[]) {
  for (const slug of slugs) {
    const term = await prisma.taxonomyTerm.findFirstOrThrow({ where: { slug } });
    await prisma.chefTaxonomyAssignment.upsert({
      where: { uniq_chef_taxonomy: { chef_id: chefId, taxonomy_term_id: term.id } },
      update: {
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
      create: {
        chef_id: chefId,
        taxonomy_term_id: term.id,
        relevance_score: 1,
        is_primary: slugs[0] === slug,
      },
    });
  }
}

async function seedKucookGraph() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "atelier-seoul-fire-table" },
    update: {},
    create: {
      name: "아틀리에 서울 파이어 테이블",
      slug: "atelier-seoul-fire-table",
      brand_name: "KUCOOK Signature",
      description: "직화 한식 파인다이닝과 와인 페어링 중심의 실험형 레스토랑",
      country: "KR",
      region_depth1: "서울",
      region_depth2: "강남",
      city: "서울",
      district: "강남",
      address: "서울 강남구 테헤란로 100",
      latitude: 37.498,
      longitude: 127.028,
      price_band: "premium",
      service_model: "fine-dining",
      website_url: "https://kucook.example/restaurants/atelier-seoul-fire-table",
    },
  });

  const chef = await prisma.chef.upsert({
    where: { slug: "chef-min-jun" },
    update: {},
    create: {
      name: "민준 셰프",
      slug: "chef-min-jun",
      bio: "발효와 직화 기술을 현대 한식에 재해석하는 셰프",
      signature_style: "Fermented Fire Korean",
      career_years: 14,
      nationality: "KR",
      hometown: "서울",
    },
  });

  await prisma.chefRestaurant.upsert({
    where: {
      uniq_chef_restaurant_role: {
        chef_id: chef.id,
        restaurant_id: restaurant.id,
        role: "EXECUTIVE_CHEF",
      },
    },
    update: { is_current: true },
    create: {
      chef_id: chef.id,
      restaurant_id: restaurant.id,
      role: "EXECUTIVE_CHEF",
      is_current: true,
    },
  });

  const ingredients = await Promise.all(
    [
      { name: "한우", slug: "hanwoo-beef", group: "beef" },
      { name: "된장", slug: "doenjang", group: "fermented" },
      { name: "트러플", slug: "black-truffle", group: "fungi" },
      { name: "관자", slug: "scallop", group: "shellfish" },
      { name: "버터", slug: "cultured-butter", group: "dairy" },
    ].map((item) =>
      prisma.ingredient.upsert({
        where: { slug: item.slug },
        update: { canonical_name: item.name, ingredient_group: item.group },
        create: {
          name: item.name,
          slug: item.slug,
          canonical_name: item.name,
          ingredient_group: item.group,
        },
      }),
    ),
  );

  const dish1 = await prisma.dish.upsert({
    where: { slug: "charcoal-hanwoo-doenjang" },
    update: { primary_chef_id: chef.id },
    create: {
      name: "숯불 한우 된장 글레이즈",
      slug: "charcoal-hanwoo-doenjang",
      canonical_name: "숯불 한우 된장 글레이즈",
      description: "직화한 한우 위에 숙성 된장 글레이즈와 허브 오일을 올린 시그니처 메인",
      origin_region: "서울",
      spice_level: 1,
      complexity_level: 4,
      serving_temperature: "hot",
      primary_chef_id: chef.id,
      image_url: "https://kucook.example/images/charcoal-hanwoo-doenjang.jpg",
    },
  });

  const dish2 = await prisma.dish.upsert({
    where: { slug: "scallop-butter-juk" },
    update: { primary_chef_id: chef.id },
    create: {
      name: "관자 버터 죽",
      slug: "scallop-butter-juk",
      canonical_name: "관자 버터 죽",
      description: "관자와 버터, 쌀 육수로 만든 크리미 스타터",
      origin_region: "서울",
      spice_level: 0,
      complexity_level: 3,
      serving_temperature: "warm",
      primary_chef_id: chef.id,
      image_url: "https://kucook.example/images/scallop-butter-juk.jpg",
    },
  });

  await prisma.restaurantDish.upsert({
    where: { uniq_restaurant_dish: { restaurant_id: restaurant.id, dish_id: dish1.id } },
    update: { is_signature: true, price: 48000, course_label: "main-course" },
    create: {
      restaurant_id: restaurant.id,
      dish_id: dish1.id,
      is_signature: true,
      price: 48000,
      menu_label: "대표 시그니처",
      course_label: "main-course",
    },
  });

  await prisma.restaurantDish.upsert({
    where: { uniq_restaurant_dish: { restaurant_id: restaurant.id, dish_id: dish2.id } },
    update: { price: 22000, course_label: "appetizer" },
    create: {
      restaurant_id: restaurant.id,
      dish_id: dish2.id,
      price: 22000,
      menu_label: "웰컴 스타터",
      course_label: "appetizer",
    },
  });

  const ingredientMap = Object.fromEntries(ingredients.map((item: { slug: string; id: number }) => [item.slug, item.id]));
  const dishIngredients = [
    { dishId: dish1.id, ingredientSlug: "hanwoo-beef", role: "PRIMARY" },
    { dishId: dish1.id, ingredientSlug: "doenjang", role: "SAUCE" },
    { dishId: dish1.id, ingredientSlug: "black-truffle", role: "GARNISH" },
    { dishId: dish2.id, ingredientSlug: "scallop", role: "PRIMARY" },
    { dishId: dish2.id, ingredientSlug: "cultured-butter", role: "BASE" },
  ];

  for (const item of dishIngredients) {
    await prisma.dishIngredient.upsert({
      where: {
        uniq_dish_ingredient_role: {
          dish_id: item.dishId,
          ingredient_id: ingredientMap[item.ingredientSlug],
          role: item.role,
        },
      },
      update: {},
      create: {
        dish_id: item.dishId,
        ingredient_id: ingredientMap[item.ingredientSlug],
        role: item.role,
      },
    });
  }

  await assignRestaurantTaxonomies(restaurant.id, [
    "fine-dining",
    "korean",
    "gangnam",
    "premium",
    "date-night",
  ]);
  await assignChefTaxonomies(chef.id, ["korean", "fermented", "direct-fire", "signature-course"]);
  await assignDishTaxonomies(dish1.id, ["korean", "grill", "beef", "fermented", "umami", "red-wine", "signature-course"]);
  await assignDishTaxonomies(dish2.id, ["soup-course", "shellfish", "creamy", "warm", "white-wine"]);

  await prisma.dishCorrelation.upsert({
    where: {
      uniq_dish_correlation: {
        source_dish_id: dish1.id,
        target_dish_id: dish2.id,
        correlation_type: "PAIRS_WITH",
      },
    },
    update: { score: 0.86, confidence: 0.91, rationale: "메인과 스타터의 온도/풍미 밸런스가 좋음" },
    create: {
      source_dish_id: dish1.id,
      target_dish_id: dish2.id,
      correlation_type: "PAIRS_WITH",
      score: 0.86,
      confidence: 0.91,
      rationale: "메인과 스타터의 온도/풍미 밸런스가 좋음",
    },
  });

  const pairSource = await prisma.taxonomyTerm.findFirstOrThrow({ where: { slug: "beef" } });
  const pairTarget = await prisma.taxonomyTerm.findFirstOrThrow({ where: { slug: "red-wine" } });
  await prisma.taxonomyRelation.upsert({
    where: {
      uniq_taxonomy_relation: {
        source_term_id: pairSource.id,
        target_term_id: pairTarget.id,
        correlation_type: "PAIRS_WITH",
      },
    },
    update: { score: 0.95, confidence: 0.93, rationale: "지방감 있는 붉은 고기와 레드와인 조합" },
    create: {
      source_term_id: pairSource.id,
      target_term_id: pairTarget.id,
      correlation_type: "PAIRS_WITH",
      score: 0.95,
      confidence: 0.93,
      rationale: "지방감 있는 붉은 고기와 레드와인 조합",
    },
  });

  await prisma.dishAnalyticsSnapshot.upsert({
    where: {
      uniq_dish_metric_date: {
        dish_id: dish1.id,
        metric_date: new Date("2026-03-06T00:00:00.000Z"),
      },
    },
    update: {
      mention_count: 1280,
      restaurant_count: 18,
      menu_count: 24,
      avg_price: 47000,
      popularity_score: 91.2,
      satisfaction_score: 94.5,
    },
    create: {
      dish_id: dish1.id,
      metric_date: new Date("2026-03-06T00:00:00.000Z"),
      mention_count: 1280,
      restaurant_count: 18,
      menu_count: 24,
      avg_price: 47000,
      popularity_score: 91.2,
      satisfaction_score: 94.5,
    },
  });

  await prisma.taxonomyAnalyticsSnapshot.upsert({
    where: {
      uniq_taxonomy_metric_date: {
        taxonomy_term_id: pairSource.id,
        metric_date: new Date("2026-03-06T00:00:00.000Z"),
      },
    },
    update: {
      dish_count: 84,
      restaurant_count: 41,
      chef_count: 27,
      popularity_score: 88.8,
    },
    create: {
      taxonomy_term_id: pairSource.id,
      metric_date: new Date("2026-03-06T00:00:00.000Z"),
      dish_count: 84,
      restaurant_count: 41,
      chef_count: 27,
      popularity_score: 88.8,
    },
  });

  return { restaurant, chef, dish1, dish2 };
}

async function main() {
  console.log("Start seeding...");

  const user = await prisma.user.upsert({
    where: { email: "manager@piwpiw.com" },
    update: {},
    create: {
      email: "manager@piwpiw.com",
      nickname: "piwpiw_admin",
    },
  });

  await prisma.notificationDelivery.deleteMany({});
  await prisma.userSchedule.deleteMany({});
  await prisma.userActionLog.deleteMany({});
  await prisma.campaignSnapshot.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.ingestRun.deleteMany({});
  await prisma.platform.deleteMany({});

  const platforms = [
    { id: 1, name: "Revu", base_url: "https://revu.net" },
    { id: 2, name: "Reviewnote", base_url: "https://reviewnote.co.kr" },
    { id: 3, name: "DinnerQueen", base_url: "https://dinnerqueen.net" },
    { id: 4, name: "ReviewPlace", base_url: "https://reviewplace.co.kr" },
    { id: 5, name: "Seouloppa", base_url: "https://www.seouloppa.com" },
    { id: 6, name: "MrBlog", base_url: "https://mrblog.net" },
    { id: 7, name: "GangnamFood", base_url: "https://gangnamfood.com" },
  ];

  for (const platform of platforms) {
    await prisma.platform.create({
      data: {
        id: platform.id,
        name: platform.name,
        base_url: platform.base_url,
        is_active: true,
      },
    });
  }

  await seedTaxonomy();
  const graph = await seedKucookGraph();

  const sampleCampaigns = [
    {
      platform_id: 1,
      restaurant_id: graph.restaurant.id,
      representative_dish_id: graph.dish1.id,
      original_id: "revu-001",
      title: "[서울 강남] 숯불 한우 된장 글레이즈 파인다이닝 체험",
      campaign_type: "VST",
      media_type: "BP",
      category: "파인다이닝",
      region_depth1: "서울",
      region_depth2: "강남",
      location: "서울 강남구 테헤란로 100",
      reward_value: 120000,
      url: "https://revu.net/campaign/1",
      recruit_count: 5,
      applicant_count: 150,
      competition_rate: 30.0,
      apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
    {
      platform_id: 2,
      original_id: "rn-001",
      title: "[서울] 프리미엄 스킨케어 세트",
      campaign_type: "SHP",
      media_type: "IP",
      category: "뷰티",
      reward_value: 100000,
      url: "https://reviewnote.co.kr/campaign/1",
      recruit_count: 20,
      applicant_count: 25,
      competition_rate: 1.25,
      apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    {
      platform_id: 3,
      original_id: "dq-001",
      title: "[부산 해운대] 럭셔리 호텔 1박 숙박권",
      campaign_type: "VST",
      media_type: "BP",
      category: "숙박",
      region_depth1: "부산",
      region_depth2: "해운대",
      reward_value: 250000,
      url: "https://dinnerqueen.net/campaign/1",
      recruit_count: 2,
      applicant_count: 120,
      competition_rate: 60.0,
      apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
    {
      platform_id: 4,
      original_id: "rp-001",
      title: "[원고료 지급] 홈케어 리빙 리뷰",
      campaign_type: "PRS",
      media_type: "IP",
      category: "리빙",
      reward_value: 50000,
      url: "https://reviewplace.co.kr/campaign/1",
      recruit_count: 50,
      applicant_count: 60,
      competition_rate: 1.2,
      apply_end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    },
  ];

  for (const campaign of sampleCampaigns) {
    await prisma.campaign.create({ data: campaign });
  }

  const dbCampaigns = await prisma.campaign.findMany();

  const schedules = [
    {
      user_id: user.id,
      campaign_id: dbCampaigns[0]?.id,
      custom_title: "강남 파인다이닝 방문",
      status: "SCHEDULED",
      visit_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      sponsorship_value: 120000,
      ad_fee: 0,
      memo: "코스 촬영 컷 확보",
    },
    {
      user_id: user.id,
      campaign_id: dbCampaigns[1]?.id,
      custom_title: "스킨케어 리뷰 업로드",
      status: "PENDING",
      deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sponsorship_value: 100000,
      ad_fee: 20000,
    },
  ];

  for (const schedule of schedules) {
    if (schedule.campaign_id) {
      await prisma.userSchedule.create({ data: schedule });
    }
  }

  await prisma.ingestRun.createMany({
    data: [
      {
        platform_id: 1,
        status: "SUCCESS",
        records_added: 120,
        records_updated: 50,
        start_time: new Date(Date.now() - 3600000),
        end_time: new Date(),
      },
      {
        platform_id: 2,
        status: "FAILED",
        records_added: 0,
        error_log: "Connection Timeout",
        start_time: new Date(Date.now() - 7200000),
        end_time: new Date(Date.now() - 7100000),
      },
      {
        platform_id: 3,
        status: "SUCCESS",
        records_added: 45,
        records_updated: 10,
        start_time: new Date(Date.now() - 1200000),
        end_time: new Date(),
      },
    ],
  });

  console.log(`Seeded user=${user.email}, campaigns=${dbCampaigns.length}, taxonomy=${KUCOOK_TAXONOMY_SEEDS.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
