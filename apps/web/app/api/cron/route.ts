import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { InitializedAdapters } from "@/sources/registry";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const activePlatforms = await db.platform.findMany({ where: { is_active: true } });

        // In production, you'd spawn independent workers or Vercel functions for each platform
        // For this prototype, we'll hit internal /api/admin/ingest or call the logic directly
        const responses = activePlatforms.map(p => {
            const adapter = InitializedAdapters[p.name.toLowerCase()];
            if (adapter) {
                // Push task
                return `Started ${p.name}`;
            }
            return `Skipped ${p.name} (no adapter)`;
        });

        return NextResponse.json({ message: "Cron triggered for platforms", details: responses });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
