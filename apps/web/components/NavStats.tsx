import { db } from "@/lib/db";

export default async function NavStats() {
    let total = 0;
    try {
        total = await db.campaign.count();
    } catch {
        total = 0;
    }

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-black text-blue-700">
                {total.toLocaleString()}건 실시간
            </span>
        </div>
    );
}
