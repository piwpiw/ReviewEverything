export type KucookTaxonomySeed = {
  kind:
    | "CUISINE"
    | "REGION"
    | "DISH_TYPE"
    | "COURSE"
    | "PROTEIN"
    | "MAIN_INGREDIENT"
    | "COOKING_TECHNIQUE"
    | "FLAVOR"
    | "TEXTURE"
    | "TEMPERATURE"
    | "SERVICE_STYLE"
    | "DIETARY"
    | "ALLERGEN"
    | "OCCASION"
    | "BEVERAGE_PAIRING"
    | "PRICE_TIER";
  name: string;
  slug: string;
  iconEmoji: string;
  iconKey: string;
  badgeColor: string;
  sortOrder: number;
  description?: string;
  parentSlug?: string;
  aliases?: string[];
};

export const KUCOOK_TAXONOMY_SEEDS: KucookTaxonomySeed[] = [
  { kind: "CUISINE", name: "한식", slug: "korean", iconEmoji: "🍚", iconKey: "rice-bowl", badgeColor: "amber", sortOrder: 1 },
  { kind: "CUISINE", name: "일식", slug: "japanese", iconEmoji: "🍣", iconKey: "sushi", badgeColor: "rose", sortOrder: 2 },
  { kind: "CUISINE", name: "중식", slug: "chinese", iconEmoji: "🥢", iconKey: "chopsticks", badgeColor: "red", sortOrder: 3 },
  { kind: "CUISINE", name: "양식", slug: "western", iconEmoji: "🍽️", iconKey: "plate", badgeColor: "slate", sortOrder: 4 },
  { kind: "CUISINE", name: "프렌치", slug: "french", iconEmoji: "🧈", iconKey: "butter", badgeColor: "indigo", sortOrder: 5 },
  { kind: "CUISINE", name: "이탈리안", slug: "italian", iconEmoji: "🍝", iconKey: "pasta", badgeColor: "emerald", sortOrder: 6 },
  { kind: "CUISINE", name: "스페니시", slug: "spanish", iconEmoji: "🥘", iconKey: "paella", badgeColor: "orange", sortOrder: 7 },
  { kind: "CUISINE", name: "멕시칸", slug: "mexican", iconEmoji: "🌮", iconKey: "taco", badgeColor: "yellow", sortOrder: 8 },
  { kind: "CUISINE", name: "태국식", slug: "thai", iconEmoji: "🍜", iconKey: "thai-noodle", badgeColor: "lime", sortOrder: 9 },
  { kind: "CUISINE", name: "베트남식", slug: "vietnamese", iconEmoji: "🥬", iconKey: "pho-green", badgeColor: "green", sortOrder: 10 },
  { kind: "CUISINE", name: "인도식", slug: "indian", iconEmoji: "🍛", iconKey: "curry", badgeColor: "amber", sortOrder: 11 },
  { kind: "CUISINE", name: "중동식", slug: "middle-eastern", iconEmoji: "🫓", iconKey: "flatbread", badgeColor: "stone", sortOrder: 12 },
  { kind: "CUISINE", name: "퓨전", slug: "fusion", iconEmoji: "✨", iconKey: "spark", badgeColor: "violet", sortOrder: 13 },
  { kind: "CUISINE", name: "비건 다이닝", slug: "vegan-dining", iconEmoji: "🌱", iconKey: "vegan", badgeColor: "emerald", sortOrder: 14 },

  { kind: "DISH_TYPE", name: "국밥", slug: "gukbap", iconEmoji: "🍲", iconKey: "gukbap", badgeColor: "amber", sortOrder: 1 },
  { kind: "DISH_TYPE", name: "탕", slug: "soup", iconEmoji: "🥘", iconKey: "soup", badgeColor: "orange", sortOrder: 2 },
  { kind: "DISH_TYPE", name: "찌개", slug: "jjigae", iconEmoji: "🍛", iconKey: "jjigae", badgeColor: "red", sortOrder: 3 },
  { kind: "DISH_TYPE", name: "구이", slug: "grill", iconEmoji: "🍖", iconKey: "grill", badgeColor: "rose", sortOrder: 4 },
  { kind: "DISH_TYPE", name: "찜", slug: "steam-braise", iconEmoji: "♨️", iconKey: "steam", badgeColor: "orange", sortOrder: 5 },
  { kind: "DISH_TYPE", name: "볶음", slug: "stir-fry", iconEmoji: "🍳", iconKey: "pan", badgeColor: "yellow", sortOrder: 6 },
  { kind: "DISH_TYPE", name: "전골", slug: "hotpot", iconEmoji: "🍲", iconKey: "hotpot", badgeColor: "amber", sortOrder: 7 },
  { kind: "DISH_TYPE", name: "면", slug: "noodle", iconEmoji: "🍜", iconKey: "noodle", badgeColor: "lime", sortOrder: 8 },
  { kind: "DISH_TYPE", name: "파스타", slug: "pasta", iconEmoji: "🍝", iconKey: "pasta", badgeColor: "emerald", sortOrder: 9 },
  { kind: "DISH_TYPE", name: "덮밥", slug: "rice-bowl", iconEmoji: "🍛", iconKey: "rice-bowl", badgeColor: "amber", sortOrder: 10 },
  { kind: "DISH_TYPE", name: "초밥", slug: "sushi", iconEmoji: "🍣", iconKey: "sushi", badgeColor: "pink", sortOrder: 11 },
  { kind: "DISH_TYPE", name: "사시미", slug: "sashimi", iconEmoji: "🐟", iconKey: "fish", badgeColor: "sky", sortOrder: 12 },
  { kind: "DISH_TYPE", name: "버거", slug: "burger", iconEmoji: "🍔", iconKey: "burger", badgeColor: "yellow", sortOrder: 13 },
  { kind: "DISH_TYPE", name: "피자", slug: "pizza", iconEmoji: "🍕", iconKey: "pizza", badgeColor: "red", sortOrder: 14 },
  { kind: "DISH_TYPE", name: "샐러드", slug: "salad", iconEmoji: "🥗", iconKey: "salad", badgeColor: "green", sortOrder: 15 },
  { kind: "DISH_TYPE", name: "디저트", slug: "dessert", iconEmoji: "🍰", iconKey: "dessert", badgeColor: "pink", sortOrder: 16 },
  { kind: "DISH_TYPE", name: "브런치", slug: "brunch", iconEmoji: "🍳", iconKey: "brunch", badgeColor: "amber", sortOrder: 17 },
  { kind: "DISH_TYPE", name: "안주", slug: "anju", iconEmoji: "🍺", iconKey: "beer-food", badgeColor: "orange", sortOrder: 18 },
  { kind: "DISH_TYPE", name: "코스요리", slug: "course-meal", iconEmoji: "🍽️", iconKey: "course", badgeColor: "slate", sortOrder: 19 },
  { kind: "DISH_TYPE", name: "오마카세", slug: "omakase", iconEmoji: "🎌", iconKey: "omakase", badgeColor: "violet", sortOrder: 20 },

  { kind: "COURSE", name: "아뮤즈부쉬", slug: "amuse-bouche", iconEmoji: "✨", iconKey: "amuse", badgeColor: "violet", sortOrder: 1 },
  { kind: "COURSE", name: "애피타이저", slug: "appetizer", iconEmoji: "🥗", iconKey: "starter", badgeColor: "green", sortOrder: 2 },
  { kind: "COURSE", name: "스프", slug: "soup-course", iconEmoji: "🥣", iconKey: "soup-course", badgeColor: "amber", sortOrder: 3 },
  { kind: "COURSE", name: "메인", slug: "main-course", iconEmoji: "🍖", iconKey: "main", badgeColor: "rose", sortOrder: 4 },
  { kind: "COURSE", name: "사이드", slug: "side-course", iconEmoji: "🍟", iconKey: "side", badgeColor: "yellow", sortOrder: 5 },
  { kind: "COURSE", name: "디저트", slug: "dessert-course", iconEmoji: "🍰", iconKey: "dessert-course", badgeColor: "pink", sortOrder: 6 },
  { kind: "COURSE", name: "페어링", slug: "pairing-course", iconEmoji: "🍷", iconKey: "pairing", badgeColor: "purple", sortOrder: 7 },
  { kind: "COURSE", name: "시그니처", slug: "signature-course", iconEmoji: "⭐", iconKey: "signature", badgeColor: "amber", sortOrder: 8 },

  { kind: "PROTEIN", name: "소고기", slug: "beef", iconEmoji: "🐄", iconKey: "beef", badgeColor: "rose", sortOrder: 1 },
  { kind: "PROTEIN", name: "돼지고기", slug: "pork", iconEmoji: "🐖", iconKey: "pork", badgeColor: "pink", sortOrder: 2 },
  { kind: "PROTEIN", name: "닭고기", slug: "chicken", iconEmoji: "🐓", iconKey: "chicken", badgeColor: "yellow", sortOrder: 3 },
  { kind: "PROTEIN", name: "양고기", slug: "lamb", iconEmoji: "🐑", iconKey: "lamb", badgeColor: "stone", sortOrder: 4 },
  { kind: "PROTEIN", name: "오리고기", slug: "duck", iconEmoji: "🦆", iconKey: "duck", badgeColor: "orange", sortOrder: 5 },
  { kind: "PROTEIN", name: "생선", slug: "fish", iconEmoji: "🐟", iconKey: "fish", badgeColor: "sky", sortOrder: 6 },
  { kind: "PROTEIN", name: "참치", slug: "tuna", iconEmoji: "🍣", iconKey: "tuna", badgeColor: "red", sortOrder: 7 },
  { kind: "PROTEIN", name: "연어", slug: "salmon", iconEmoji: "🐠", iconKey: "salmon", badgeColor: "orange", sortOrder: 8 },
  { kind: "PROTEIN", name: "새우", slug: "shrimp", iconEmoji: "🦐", iconKey: "shrimp", badgeColor: "pink", sortOrder: 9 },
  { kind: "PROTEIN", name: "게", slug: "crab", iconEmoji: "🦀", iconKey: "crab", badgeColor: "red", sortOrder: 10 },
  { kind: "PROTEIN", name: "조개", slug: "shellfish", iconEmoji: "🦪", iconKey: "shellfish", badgeColor: "slate", sortOrder: 11 },
  { kind: "PROTEIN", name: "문어", slug: "octopus", iconEmoji: "🐙", iconKey: "octopus", badgeColor: "violet", sortOrder: 12 },
  { kind: "PROTEIN", name: "두부", slug: "tofu", iconEmoji: "⬜", iconKey: "tofu", badgeColor: "zinc", sortOrder: 13 },
  { kind: "PROTEIN", name: "달걀", slug: "egg", iconEmoji: "🥚", iconKey: "egg", badgeColor: "yellow", sortOrder: 14 },
  { kind: "PROTEIN", name: "콩", slug: "bean", iconEmoji: "🫘", iconKey: "bean", badgeColor: "amber", sortOrder: 15 },

  { kind: "MAIN_INGREDIENT", name: "쌀", slug: "rice", iconEmoji: "🍚", iconKey: "rice", badgeColor: "amber", sortOrder: 1 },
  { kind: "MAIN_INGREDIENT", name: "밀", slug: "wheat", iconEmoji: "🌾", iconKey: "wheat", badgeColor: "yellow", sortOrder: 2 },
  { kind: "MAIN_INGREDIENT", name: "버섯", slug: "mushroom", iconEmoji: "🍄", iconKey: "mushroom", badgeColor: "stone", sortOrder: 3 },
  { kind: "MAIN_INGREDIENT", name: "토마토", slug: "tomato", iconEmoji: "🍅", iconKey: "tomato", badgeColor: "red", sortOrder: 4 },
  { kind: "MAIN_INGREDIENT", name: "감자", slug: "potato", iconEmoji: "🥔", iconKey: "potato", badgeColor: "amber", sortOrder: 5 },
  { kind: "MAIN_INGREDIENT", name: "고추", slug: "chili", iconEmoji: "🌶️", iconKey: "chili", badgeColor: "red", sortOrder: 6 },
  { kind: "MAIN_INGREDIENT", name: "치즈", slug: "cheese", iconEmoji: "🧀", iconKey: "cheese", badgeColor: "yellow", sortOrder: 7 },
  { kind: "MAIN_INGREDIENT", name: "허브", slug: "herb", iconEmoji: "🌿", iconKey: "herb", badgeColor: "green", sortOrder: 8 },
  { kind: "MAIN_INGREDIENT", name: "트러플", slug: "truffle", iconEmoji: "🟤", iconKey: "truffle", badgeColor: "stone", sortOrder: 9 },
  { kind: "MAIN_INGREDIENT", name: "마늘", slug: "garlic", iconEmoji: "🧄", iconKey: "garlic", badgeColor: "slate", sortOrder: 10 },
  { kind: "MAIN_INGREDIENT", name: "양파", slug: "onion", iconEmoji: "🧅", iconKey: "onion", badgeColor: "amber", sortOrder: 11 },
  { kind: "MAIN_INGREDIENT", name: "해산물", slug: "seafood", iconEmoji: "🦞", iconKey: "seafood", badgeColor: "sky", sortOrder: 12 },
  { kind: "MAIN_INGREDIENT", name: "육수", slug: "stock", iconEmoji: "🍲", iconKey: "stock", badgeColor: "orange", sortOrder: 13 },

  { kind: "COOKING_TECHNIQUE", name: "직화", slug: "direct-fire", iconEmoji: "🔥", iconKey: "fire", badgeColor: "red", sortOrder: 1 },
  { kind: "COOKING_TECHNIQUE", name: "숯불", slug: "charcoal-grill", iconEmoji: "♨️", iconKey: "charcoal", badgeColor: "stone", sortOrder: 2 },
  { kind: "COOKING_TECHNIQUE", name: "훈연", slug: "smoked", iconEmoji: "💨", iconKey: "smoke", badgeColor: "slate", sortOrder: 3 },
  { kind: "COOKING_TECHNIQUE", name: "튀김", slug: "fried", iconEmoji: "🍤", iconKey: "fried", badgeColor: "yellow", sortOrder: 4 },
  { kind: "COOKING_TECHNIQUE", name: "수비드", slug: "sous-vide", iconEmoji: "🛁", iconKey: "sous-vide", badgeColor: "sky", sortOrder: 5 },
  { kind: "COOKING_TECHNIQUE", name: "에이징", slug: "aged", iconEmoji: "🕰️", iconKey: "aging", badgeColor: "stone", sortOrder: 6 },
  { kind: "COOKING_TECHNIQUE", name: "발효", slug: "fermented", iconEmoji: "🫙", iconKey: "fermented", badgeColor: "emerald", sortOrder: 7 },
  { kind: "COOKING_TECHNIQUE", name: "브레이징", slug: "braised", iconEmoji: "🍖", iconKey: "braise", badgeColor: "amber", sortOrder: 8 },
  { kind: "COOKING_TECHNIQUE", name: "스팀", slug: "steamed", iconEmoji: "♨️", iconKey: "steam", badgeColor: "cyan", sortOrder: 9 },
  { kind: "COOKING_TECHNIQUE", name: "로스팅", slug: "roasted", iconEmoji: "🔥", iconKey: "roast", badgeColor: "orange", sortOrder: 10 },
  { kind: "COOKING_TECHNIQUE", name: "리덕션", slug: "reduction", iconEmoji: "🍷", iconKey: "reduction", badgeColor: "purple", sortOrder: 11 },
  { kind: "COOKING_TECHNIQUE", name: "절임", slug: "pickled", iconEmoji: "🥒", iconKey: "pickled", badgeColor: "lime", sortOrder: 12 },

  { kind: "FLAVOR", name: "감칠맛", slug: "umami", iconEmoji: "🤎", iconKey: "umami", badgeColor: "stone", sortOrder: 1 },
  { kind: "FLAVOR", name: "매운맛", slug: "spicy", iconEmoji: "🌶️", iconKey: "spicy", badgeColor: "red", sortOrder: 2 },
  { kind: "FLAVOR", name: "단맛", slug: "sweet", iconEmoji: "🍯", iconKey: "sweet", badgeColor: "amber", sortOrder: 3 },
  { kind: "FLAVOR", name: "짠맛", slug: "salty", iconEmoji: "🧂", iconKey: "salty", badgeColor: "slate", sortOrder: 4 },
  { kind: "FLAVOR", name: "산미", slug: "acidic", iconEmoji: "🍋", iconKey: "acidic", badgeColor: "yellow", sortOrder: 5 },
  { kind: "FLAVOR", name: "고소함", slug: "nutty", iconEmoji: "🥜", iconKey: "nutty", badgeColor: "amber", sortOrder: 6 },
  { kind: "FLAVOR", name: "쌉싸름함", slug: "bitter", iconEmoji: "☕", iconKey: "bitter", badgeColor: "stone", sortOrder: 7 },
  { kind: "FLAVOR", name: "허브향", slug: "herbal", iconEmoji: "🌿", iconKey: "herbal", badgeColor: "green", sortOrder: 8 },
  { kind: "FLAVOR", name: "스모키", slug: "smoky", iconEmoji: "🔥", iconKey: "smoky", badgeColor: "orange", sortOrder: 9 },
  { kind: "FLAVOR", name: "크리미", slug: "creamy", iconEmoji: "🥛", iconKey: "creamy", badgeColor: "blue", sortOrder: 10 },
  { kind: "FLAVOR", name: "상큼함", slug: "fresh", iconEmoji: "🍊", iconKey: "fresh", badgeColor: "orange", sortOrder: 11 },

  { kind: "TEXTURE", name: "바삭함", slug: "crispy", iconEmoji: "🥨", iconKey: "crispy", badgeColor: "amber", sortOrder: 1 },
  { kind: "TEXTURE", name: "쫄깃함", slug: "chewy", iconEmoji: "🫓", iconKey: "chewy", badgeColor: "stone", sortOrder: 2 },
  { kind: "TEXTURE", name: "부드러움", slug: "soft", iconEmoji: "☁️", iconKey: "soft", badgeColor: "sky", sortOrder: 3 },
  { kind: "TEXTURE", name: "촉촉함", slug: "juicy", iconEmoji: "💧", iconKey: "juicy", badgeColor: "cyan", sortOrder: 4 },
  { kind: "TEXTURE", name: "크리미함", slug: "silky", iconEmoji: "🥄", iconKey: "silky", badgeColor: "blue", sortOrder: 5 },
  { kind: "TEXTURE", name: "묵직함", slug: "heavy", iconEmoji: "🪨", iconKey: "heavy", badgeColor: "stone", sortOrder: 6 },
  { kind: "TEXTURE", name: "아삭함", slug: "crunchy", iconEmoji: "🥒", iconKey: "crunchy", badgeColor: "lime", sortOrder: 7 },
  { kind: "TEXTURE", name: "녹진함", slug: "rich", iconEmoji: "🫕", iconKey: "rich", badgeColor: "orange", sortOrder: 8 },

  { kind: "TEMPERATURE", name: "차가움", slug: "cold", iconEmoji: "🧊", iconKey: "cold", badgeColor: "sky", sortOrder: 1 },
  { kind: "TEMPERATURE", name: "미지근함", slug: "room-temp", iconEmoji: "🌤️", iconKey: "room-temp", badgeColor: "yellow", sortOrder: 2 },
  { kind: "TEMPERATURE", name: "따뜻함", slug: "warm", iconEmoji: "☀️", iconKey: "warm", badgeColor: "amber", sortOrder: 3 },
  { kind: "TEMPERATURE", name: "뜨거움", slug: "hot", iconEmoji: "♨️", iconKey: "hot", badgeColor: "red", sortOrder: 4 },

  { kind: "SERVICE_STYLE", name: "파인다이닝", slug: "fine-dining", iconEmoji: "🍾", iconKey: "fine-dining", badgeColor: "purple", sortOrder: 1 },
  { kind: "SERVICE_STYLE", name: "캐주얼다이닝", slug: "casual-dining", iconEmoji: "🙂", iconKey: "casual", badgeColor: "emerald", sortOrder: 2 },
  { kind: "SERVICE_STYLE", name: "비스트로", slug: "bistro", iconEmoji: "🥖", iconKey: "bistro", badgeColor: "amber", sortOrder: 3 },
  { kind: "SERVICE_STYLE", name: "오마카세", slug: "omakase-style", iconEmoji: "🎎", iconKey: "omakase-style", badgeColor: "violet", sortOrder: 4 },
  { kind: "SERVICE_STYLE", name: "바 다이닝", slug: "bar-dining", iconEmoji: "🍸", iconKey: "bar", badgeColor: "pink", sortOrder: 5 },
  { kind: "SERVICE_STYLE", name: "테이스팅 코스", slug: "tasting-course", iconEmoji: "👨‍🍳", iconKey: "tasting", badgeColor: "slate", sortOrder: 6 },
  { kind: "SERVICE_STYLE", name: "포장 중심", slug: "takeout", iconEmoji: "🥡", iconKey: "takeout", badgeColor: "orange", sortOrder: 7 },
  { kind: "SERVICE_STYLE", name: "배달 중심", slug: "delivery", iconEmoji: "🛵", iconKey: "delivery", badgeColor: "lime", sortOrder: 8 },

  { kind: "DIETARY", name: "비건", slug: "vegan", iconEmoji: "🌱", iconKey: "vegan", badgeColor: "emerald", sortOrder: 1 },
  { kind: "DIETARY", name: "베지테리언", slug: "vegetarian", iconEmoji: "🥬", iconKey: "vegetarian", badgeColor: "green", sortOrder: 2 },
  { kind: "DIETARY", name: "글루텐프리", slug: "gluten-free", iconEmoji: "🚫🌾", iconKey: "gluten-free", badgeColor: "yellow", sortOrder: 3 },
  { kind: "DIETARY", name: "저탄고지", slug: "low-carb", iconEmoji: "🥓", iconKey: "low-carb", badgeColor: "rose", sortOrder: 4 },
  { kind: "DIETARY", name: "할랄", slug: "halal", iconEmoji: "🕌", iconKey: "halal", badgeColor: "teal", sortOrder: 5 },
  { kind: "DIETARY", name: "코셔", slug: "kosher", iconEmoji: "✡️", iconKey: "kosher", badgeColor: "indigo", sortOrder: 6 },
  { kind: "DIETARY", name: "무알콜", slug: "alcohol-free", iconEmoji: "🍹", iconKey: "alcohol-free", badgeColor: "cyan", sortOrder: 7 },

  { kind: "ALLERGEN", name: "유제품", slug: "dairy", iconEmoji: "🥛", iconKey: "dairy", badgeColor: "blue", sortOrder: 1 },
  { kind: "ALLERGEN", name: "견과류", slug: "nut", iconEmoji: "🥜", iconKey: "nut", badgeColor: "amber", sortOrder: 2 },
  { kind: "ALLERGEN", name: "갑각류", slug: "crustacean", iconEmoji: "🦐", iconKey: "crustacean", badgeColor: "red", sortOrder: 3 },
  { kind: "ALLERGEN", name: "조개류", slug: "mollusk", iconEmoji: "🦪", iconKey: "mollusk", badgeColor: "slate", sortOrder: 4 },
  { kind: "ALLERGEN", name: "밀", slug: "gluten", iconEmoji: "🌾", iconKey: "gluten", badgeColor: "yellow", sortOrder: 5 },
  { kind: "ALLERGEN", name: "대두", slug: "soy", iconEmoji: "🫘", iconKey: "soy", badgeColor: "amber", sortOrder: 6 },
  { kind: "ALLERGEN", name: "달걀", slug: "egg-allergen", iconEmoji: "🥚", iconKey: "egg-allergen", badgeColor: "yellow", sortOrder: 7 },

  { kind: "OCCASION", name: "데이트", slug: "date-night", iconEmoji: "❤️", iconKey: "date", badgeColor: "pink", sortOrder: 1 },
  { kind: "OCCASION", name: "기념일", slug: "anniversary", iconEmoji: "🎂", iconKey: "anniversary", badgeColor: "purple", sortOrder: 2 },
  { kind: "OCCASION", name: "회식", slug: "team-dinner", iconEmoji: "🍻", iconKey: "team-dinner", badgeColor: "amber", sortOrder: 3 },
  { kind: "OCCASION", name: "가족모임", slug: "family", iconEmoji: "👨‍👩‍👧‍👦", iconKey: "family", badgeColor: "green", sortOrder: 4 },
  { kind: "OCCASION", name: "혼밥", slug: "solo-meal", iconEmoji: "🙋", iconKey: "solo", badgeColor: "sky", sortOrder: 5 },
  { kind: "OCCASION", name: "접대", slug: "business-hosting", iconEmoji: "🤝", iconKey: "business", badgeColor: "slate", sortOrder: 6 },
  { kind: "OCCASION", name: "브런치모임", slug: "brunch-meeting", iconEmoji: "☕", iconKey: "brunch-meeting", badgeColor: "orange", sortOrder: 7 },
  { kind: "OCCASION", name: "야식", slug: "late-night", iconEmoji: "🌙", iconKey: "late-night", badgeColor: "indigo", sortOrder: 8 },

  { kind: "BEVERAGE_PAIRING", name: "레드와인", slug: "red-wine", iconEmoji: "🍷", iconKey: "red-wine", badgeColor: "rose", sortOrder: 1 },
  { kind: "BEVERAGE_PAIRING", name: "화이트와인", slug: "white-wine", iconEmoji: "🥂", iconKey: "white-wine", badgeColor: "yellow", sortOrder: 2 },
  { kind: "BEVERAGE_PAIRING", name: "샴페인", slug: "champagne", iconEmoji: "🍾", iconKey: "champagne", badgeColor: "amber", sortOrder: 3 },
  { kind: "BEVERAGE_PAIRING", name: "사케", slug: "sake", iconEmoji: "🍶", iconKey: "sake", badgeColor: "slate", sortOrder: 4 },
  { kind: "BEVERAGE_PAIRING", name: "하이볼", slug: "highball", iconEmoji: "🥃", iconKey: "highball", badgeColor: "orange", sortOrder: 5 },
  { kind: "BEVERAGE_PAIRING", name: "전통주", slug: "traditional-liquor", iconEmoji: "🏺", iconKey: "traditional-liquor", badgeColor: "stone", sortOrder: 6 },
  { kind: "BEVERAGE_PAIRING", name: "맥주", slug: "beer", iconEmoji: "🍺", iconKey: "beer", badgeColor: "yellow", sortOrder: 7 },
  { kind: "BEVERAGE_PAIRING", name: "칵테일", slug: "cocktail", iconEmoji: "🍸", iconKey: "cocktail", badgeColor: "pink", sortOrder: 8 },
  { kind: "BEVERAGE_PAIRING", name: "커피", slug: "coffee", iconEmoji: "☕", iconKey: "coffee", badgeColor: "stone", sortOrder: 9 },
  { kind: "BEVERAGE_PAIRING", name: "티", slug: "tea", iconEmoji: "🫖", iconKey: "tea", badgeColor: "emerald", sortOrder: 10 },
  { kind: "BEVERAGE_PAIRING", name: "무알콜 페어링", slug: "non-alcoholic-pairing", iconEmoji: "🍹", iconKey: "non-alcoholic-pairing", badgeColor: "cyan", sortOrder: 11 },

  { kind: "PRICE_TIER", name: "엔트리", slug: "entry", iconEmoji: "💵", iconKey: "entry", badgeColor: "green", sortOrder: 1 },
  { kind: "PRICE_TIER", name: "미들", slug: "middle", iconEmoji: "💸", iconKey: "middle", badgeColor: "blue", sortOrder: 2 },
  { kind: "PRICE_TIER", name: "프리미엄", slug: "premium", iconEmoji: "💎", iconKey: "premium", badgeColor: "purple", sortOrder: 3 },
  { kind: "PRICE_TIER", name: "럭셔리", slug: "luxury", iconEmoji: "👑", iconKey: "luxury", badgeColor: "amber", sortOrder: 4 },

  { kind: "REGION", name: "서울", slug: "seoul", iconEmoji: "🏙️", iconKey: "seoul", badgeColor: "sky", sortOrder: 1 },
  { kind: "REGION", name: "강남", slug: "gangnam", iconEmoji: "🌃", iconKey: "gangnam", badgeColor: "indigo", sortOrder: 2, parentSlug: "seoul" },
  { kind: "REGION", name: "을지로", slug: "euljiro", iconEmoji: "🏮", iconKey: "euljiro", badgeColor: "orange", sortOrder: 3, parentSlug: "seoul" },
  { kind: "REGION", name: "성수", slug: "seongsu", iconEmoji: "🏭", iconKey: "seongsu", badgeColor: "slate", sortOrder: 4, parentSlug: "seoul" },

  { kind: "TEMPERATURE", name: "차갑게 제공", slug: "served-cold", iconEmoji: "🧊", iconKey: "served-cold", badgeColor: "sky", sortOrder: 10 },
  { kind: "SERVICE_STYLE", name: "포토제닉", slug: "photogenic", iconEmoji: "📸", iconKey: "photogenic", badgeColor: "pink", sortOrder: 20 },
  { kind: "OCCASION", name: "단체 추천", slug: "group-friendly", iconEmoji: "👥", iconKey: "group", badgeColor: "blue", sortOrder: 20 },
  { kind: "OCCASION", name: "셰프 추천", slug: "chef-recommended", iconEmoji: "👨‍🍳", iconKey: "chef-recommended", badgeColor: "amber", sortOrder: 21 },
];
