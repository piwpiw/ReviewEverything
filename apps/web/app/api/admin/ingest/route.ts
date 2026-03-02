import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeIngestionTask } from "@/lib/ingest";
import { InitializedAdapters } from "@/sources/registry";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const platform_id = parseInt(body.platform_id, 10);
        if (isNaN(platform_id)) {
            return NextResponse.json({ error: "Invalid platform_id format" }, { status: 400 });
        }

        const platform = await db.platform.findUnique({ where: { id: platform_id } });
        if (!platform) return NextResponse.json({ error: "Platform not found" }, { status: 404 });

        const adapterName = platform.name.toLowerCase();
        const adapter = InitializedAdapters[adapterName];

        if (!adapter) {
            return NextResponse.json({
                error: "Adapter not implemented for this platform yet",
                platform: platform.name,
                platform_id: platform.id,
                code: "ADAPTER_NOT_IMPLEMENTED",
            }, { status: 409 });
        }

        // Run ingestion asynchronously so the API responds before Vercel timeout
        executeIngestionTask(adapter, platform.id).catch(e => {
            console.error(`[Ingest Route] Background error for ${platform.name}:`, e);
        });

        return NextResponse.json({
            message: "Ingestion job started asynchronously",
            platform_id: platform.id,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
