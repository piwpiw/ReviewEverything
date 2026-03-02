import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { InitializedAdapters } from "@/sources/registry";

export async function GET() {
  try {
    const platforms = await db.platform.findMany({
      orderBy: { created_at: "desc" },
    });
    const payload = platforms.map((platform) => {
      const key = platform.name.toLowerCase();
      const hasAdapter = Boolean(InitializedAdapters[key]);
      return {
        ...platform,
        adapter_ready: hasAdapter,
        adapter_status: hasAdapter ? "implemented" : "missing",
      };
    });
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { urlList } = await req.json();
    if (!urlList || !Array.isArray(urlList)) {
      return NextResponse.json({ error: "Invalid URL list" }, { status: 400 });
    }

    const results = [];
    for (const rawUrl of urlList) {
      const url = rawUrl.trim();
      if (!url) continue;

      try {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        const hostname = urlObj.hostname.replace("www.", "");
        const name = hostname.split(".")[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

        const platform = await db.platform.upsert({
          where: { name: formattedName },
          update: { base_url: urlObj.origin },
          create: {
            name: formattedName,
            base_url: urlObj.origin,
            is_active: true,
          },
        });
        results.push(platform);
      } catch (e) {
        console.error(`Failed to parse URL: ${url}`, e);
      }
    }

    return NextResponse.json({ message: "Success", added: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
