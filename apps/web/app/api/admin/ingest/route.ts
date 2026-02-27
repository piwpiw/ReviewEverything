import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { InitializedAdapters } from "@/sources/registry";
// Note: In an actual production setup, ingestion might be fire-and-forget or pushed to a queue. For this MVP, we execute it directly and await internally if manageable, but a background pattern is safer. Here we construct the database entry and trigger async.

export async function POST(req: NextRequest) {
    try {
        const { platform_id } = await req.json();

        if (!platform_id) {
            return NextResponse.json({ error: "Missing platform_id" }, { status: 400 });
        }

        const platform = await db.platform.findUnique({ where: { id: parseInt(platform_id, 10) } });
        if (!platform) return NextResponse.json({ error: "Platform not found" }, { status: 404 });

        // Mocking an adapter lookup by name matching
        const adapterKey = platform.name.toLowerCase();
        const adapter = InitializedAdapters[adapterKey];

        if (!adapter) {
            return NextResponse.json({ error: "Adapter not implemented for this platform" }, { status: 501 });
        }

        // Creating initial IngestRun Tracking record
        const run = await db.ingestRun.create({
            data: {
                platform_id: platform.id,
                status: 'RUNNING'
            }
        });

        // We can execute background task asynchronously without blocking NextResponse
        executeIngestionTask(adapter, platform.id, run.id).catch(console.error);

        return NextResponse.json({ message: "Ingestion started", run_id: run.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function executeIngestionTask(adapter: any, platformId: number, runId: number) {
    // TODO: implement actual iteration across pages and calls to `processAndDedupeCampaign`.
    // Example wrapper logic
    try {
        const results = await adapter.fetchList(1);

        await db.ingestRun.update({
            where: { id: runId },
            data: {
                status: 'SUCCESS',
                end_time: new Date(),
                records_added: results.length // In real life, calculate based on dedupe statuses
            }
        });
    } catch (e: any) {
        await db.ingestRun.update({
            where: { id: runId },
            data: {
                status: 'FAILED',
                end_time: new Date(),
                error_log: e.message || String(e)
            }
        });
    }
}
