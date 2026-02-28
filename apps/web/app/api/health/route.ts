import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        await db.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: 'ok',
            db: 'ok',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            db: 'down',
            error: error?.message || 'database_unavailable',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
