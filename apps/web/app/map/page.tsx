import { redirect } from "next/navigation";

type SearchParams = {
  campaign_type?: string;
  media_type?: string;
  region_depth1?: string;
  region_depth2?: string;
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
  min_reward?: string;
  max_comp?: string;
  max_deadline_days?: string;
};

export default async function MapRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  const params = new URLSearchParams();
  params.set("view", "map");

  Object.entries(sp).forEach(([key, value]) => {
    if (!value) return;
    params.set(key, value);
  });

  if (!params.get("campaign_type")) params.set("campaign_type", "VST");

  redirect(`/?${params.toString()}`);
}
