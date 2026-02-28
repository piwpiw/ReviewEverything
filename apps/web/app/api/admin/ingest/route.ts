import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { InitializedAdapters } from "@/sources/registry";
import { executeIngestionTask } from "@/lib/ingest";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const platform_id = parseInt(body.platform_id, 10);
        if (isNaN(platform_id)) {
            return NextResponse.json({ error: "Invalid platform_id format" }, { status: 400 });
        }

        const platform = await db.platform.findUnique({ where: { id: platform_id } });
        if (!platform) return NextResponse.json({ error: "Platform not found" }, { status: 404 });

        const adapterKey = platform.name.toLowerCase();
        const adapter = InitializedAdapters[adapterKey];

        if (!adapter) {
            return NextResponse.json({ error: "Adapter not implemented for this platform" }, { status: 501 });
        }

        // Trigger async
        executeIngestionTask(adapter, platform.id).catch(console.error);

        return NextResponse.json({ message: "Ingestion started" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
