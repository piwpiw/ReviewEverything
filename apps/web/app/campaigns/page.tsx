import Home from "../page";

type HomeSearchParams = Awaited<Parameters<typeof Home>[0]["searchParams"]>;
type PageProps = {
  searchParams: Promise<HomeSearchParams>;
};

export default async function CampaignsPage({ searchParams }: PageProps) {
  return <Home searchParams={searchParams} />;
}
