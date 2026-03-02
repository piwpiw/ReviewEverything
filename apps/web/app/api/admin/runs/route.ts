import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isProductionRuntime } from "@/lib/runtimeEnv";

// Mock Data Generate for Local Admin Testing
const LOCAL_MOCK_RUNS = [
  { id: 101, platform_id: 1, status: "SUCCESS", records_added: 350, records_updated: 200, start_time: new Date(Date.now() - 3600000).toISOString(), platform: { name: "Revu", color: "#3b82f6" } },
  { id: 102, platform_id: 2, status: "SUCCESS", records_added: 45, records_updated: 0, start_time: new Date(Date.now() - 7200000).toISOString(), platform: { name: "Reviewnote", color: "#8b5cf6" } },
  { id: 103, platform_id: 3, status: "FAILED", error_log: "Connection Timeout", records_added: 0, records_updated: 0, start_time: new Date(Date.now() - 14400000).toISOString(), platform: { name: "DinnerQueen", color: "#f59e0b" } },
  { id: 104, platform_id: 4, status: "SUCCESS", records_added: 120, records_updated: 50, start_time: new Date(Date.now() - 21600000).toISOString(), platform: { name: "ReviewPlace", color: "#10b981" } },
  { id: 105, platform_id: 1, status: "SUCCESS", records_added: 300, records_updated: 150, start_time: new Date(Date.now() - 86400000).toISOString(), platform: { name: "Revu", color: "#3b82f6" } },
];

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const platform_id = searchParams.get("platform_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let data;
    let total;

    try {
      const where = platform_id ? { platform_id: parseInt(platform_id, 10) } : {};
      const skip = (page - 1) * limit;

      [data, total] = await Promise.all([
        db.ingestRun.findMany({
          where,
          orderBy: { start_time: "desc" },
          skip,
          take: limit,
          include: { platform: true },
        }),
        db.ingestRun.count({ where }),
      ]);
    } catch (error: unknown) {
      if (isProductionRuntime()) {
        const message = error instanceof Error ? error.message : "database_unavailable";
        return NextResponse.json({ error: message }, { status: 500 });
      }

      // DB Error Fallback: Serve Mock Data for Local Testing
      let filteredMock = LOCAL_MOCK_RUNS;
      if (platform_id) {
        const parsedPlatformId = parseInt(platform_id, 10);
        filteredMock = filteredMock.filter((r) => r.platform_id === parsedPlatformId);
      }
      data = filteredMock;
      total = filteredMock.length;
    }

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
