import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { InitializedAdapters } from "@/sources/registry";
import { executeIngestionTask } from "@/lib/ingest";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const activePlatforms = await db.platform.findMany({ where: { is_active: true } });

        const responses = activePlatforms.map(p => {
            const adapter = InitializedAdapters[p.name.toLowerCase()];
            if (adapter) {
                // Fire and forget so we don't timeout the cron request
                executeIngestionTask(adapter, p.id).catch(err => {
                    console.error(`Cron fail for ${p.name}:`, err);
                });
                return `Triggered ${p.name}`;
            }
            return `Skipped ${p.name} (no adapter)`;
        });

        return NextResponse.json({ message: "Cron triggered for platforms", details: responses });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
