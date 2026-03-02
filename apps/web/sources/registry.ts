import { IPlatformAdapter } from "./types";
import { RevuAdapter } from "./adapters/revu";
import { ReviewnoteAdapter } from "./adapters/reviewnote";
import { DinnerQueenAdapter } from "./adapters/dinnerqueen";
import { ReviewPlaceAdapter } from "./adapters/reviewplace";
import { SeouloppaAdapter } from "./adapters/seouloppa";
import { MrBlogAdapter } from "./adapters/mrblog";
import { GangnamFoodAdapter } from "./adapters/gangnamfood";
import { GenericAdapter, GenericSpec } from "./adapters/generic";

export const PLATFORM_CATALOG = [
  { key: "revu", name: "Revu", sourceKey: "revu", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true, is_active: true },
  { key: "reviewnote", name: "Reviewnote", sourceKey: "reviewnote", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true, is_active: true },
  { key: "dinnerqueen", name: "DinnerQueen", sourceKey: "dinnerqueen", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true, is_active: true },
  { key: "reviewplace", name: "ReviewPlace", sourceKey: "reviewplace", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true, is_active: true },
  { key: "seouloppa", name: "Seouloppa", sourceKey: "seouloppa", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true, is_active: true },
  { key: "mrblog", name: "MrBlog", sourceKey: "mrblog", maxPagesPerRun: 8, supportsPagination: true, canRunInParallel: false, is_active: true },
  { key: "gangnamfood", name: "GangnamFood", sourceKey: "gangnamfood", maxPagesPerRun: 8, supportsPagination: true, canRunInParallel: false, is_active: true },
  { key: "4blog", name: "4blog", sourceKey: "4blog", is_active: true },
  { key: "pimble", name: "Pimble", sourceKey: "pimble", is_active: true },
  { key: "assaview", name: "Assaview", sourceKey: "assaview", is_active: true },
  { key: "cometoplay", name: "Cometoplay", sourceKey: "cometoplay", is_active: true },
  { key: "mobble", name: "Mobble", sourceKey: "mobble", is_active: true },
  { key: "pickmee", name: "Pickmee", sourceKey: "pickmee", is_active: true },
  { key: "ringble", name: "Ringble", sourceKey: "ringble", is_active: true },
  { key: "chehumview", name: "Chehumview", sourceKey: "chehumview", is_active: true },
  { key: "dailyview", name: "Dailyview", sourceKey: "dailyview", is_active: true },
  { key: "blogreview", name: "Blogreview", sourceKey: "blogreview", is_active: true },
] as const;

const GENERIC_SPECS: Record<string, GenericSpec> = {
  "4blog": {
    platformId: 18,
    baseUrl: "https://www.4blog.net",
    listUrl: (p) => `https://www.4blog.net/campaigns?page=${p}`,
    containerSelector: ".campaign_item",
    titleSelector: ".title",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
  "pimble": {
    platformId: 19,
    baseUrl: "https://www.pimble.co.kr",
    listUrl: (p) => `https://www.pimble.co.kr/campaigns?page=${p}`,
    containerSelector: ".item",
    titleSelector: ".title",
    linkSelector: "a",
    rewardSelector: ".offer",
    thumbnailSelector: "img",
  },
  "assaview": {
    platformId: 20,
    baseUrl: "https://www.assaview.com",
    listUrl: (p) => `https://www.assaview.com/campaign/list.php?page=${p}`,
    containerSelector: ".list_box",
    titleSelector: ".subject",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
  "cometoplay": {
    platformId: 21,
    baseUrl: "https://www.cometoplay.kr",
    listUrl: (p) => `https://www.cometoplay.kr/campaign/list.php?page=${p}`,
    containerSelector: ".list_item",
    titleSelector: ".subject",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
  "mobble": {
    platformId: 25,
    baseUrl: "https://www.mobble.kr",
    listUrl: (p) => `https://www.mobble.kr/campaign/list.php?page=${p}`,
    containerSelector: ".campaign_item",
    titleSelector: ".title",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
  "pickmee": {
    platformId: 26,
    baseUrl: "https://www.pickmee.co.kr",
    listUrl: (p) => `https://www.pickmee.co.kr/campaign/list.php?page=${p}`,
    containerSelector: ".item_box",
    titleSelector: ".subject",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
  "ringble": {
    platformId: 24,
    baseUrl: "https://www.ringble.co.kr",
    listUrl: (p) => `https://www.ringble.co.kr/campaign/list.php?page=${p}`,
    containerSelector: ".list_item",
    titleSelector: ".subject",
    linkSelector: "a",
    rewardSelector: ".reward",
    thumbnailSelector: "img",
  },
};

export const InitializedAdapters: Record<string, IPlatformAdapter> = {
  "revu": Object.assign(new RevuAdapter(), { sourceKey: "revu", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true }),
  "reviewnote": Object.assign(new ReviewnoteAdapter(), { sourceKey: "reviewnote", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true }),
  "dinnerqueen": Object.assign(new DinnerQueenAdapter(), { sourceKey: "dinnerqueen", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true }),
  "reviewplace": Object.assign(new ReviewPlaceAdapter(), { sourceKey: "reviewplace", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true }),
  "seouloppa": Object.assign(new SeouloppaAdapter(), { sourceKey: "seouloppa", maxPagesPerRun: 10, supportsPagination: true, canRunInParallel: true }),
  "mrblog": Object.assign(new MrBlogAdapter(), { sourceKey: "mrblog", maxPagesPerRun: 8, supportsPagination: true, canRunInParallel: false }),
  "gangnamfood": Object.assign(new GangnamFoodAdapter(), { sourceKey: "gangnamfood", maxPagesPerRun: 8, supportsPagination: true, canRunInParallel: false }),

  "4blog": Object.assign(new GenericAdapter(GENERIC_SPECS["4blog"]), { sourceKey: "4blog", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "pimble": Object.assign(new GenericAdapter(GENERIC_SPECS["pimble"]), { sourceKey: "pimble", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "assaview": Object.assign(new GenericAdapter(GENERIC_SPECS["assaview"]), { sourceKey: "assaview", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "cometoplay": Object.assign(new GenericAdapter(GENERIC_SPECS["cometoplay"]), { sourceKey: "cometoplay", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "mobble": Object.assign(new GenericAdapter(GENERIC_SPECS["mobble"]), { sourceKey: "mobble", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "pickmee": Object.assign(new GenericAdapter(GENERIC_SPECS["pickmee"]), { sourceKey: "pickmee", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
  "ringble": Object.assign(new GenericAdapter(GENERIC_SPECS["ringble"]), { sourceKey: "ringble", maxPagesPerRun: 5, supportsPagination: true, canRunInParallel: true }),
};
