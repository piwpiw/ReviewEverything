"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function FilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) params.set(name, value);
            else params.delete(name);
            return params.toString();
        },
        [searchParams]
    );

    const handleSelect = (name: string, value: string) => {
        router.push("?" + createQueryString(name, value), { scroll: false });
    };

    return (
        <div className="flex flex-wrap gap-4 p-5 bg-white rounded-xl shadow-sm border border-slate-100 sticky top-20 z-10 transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">플랫폼</label>
                <select
                    defaultValue={searchParams.get("platform_id") || ""}
                    onChange={(e) => handleSelect("platform_id", e.target.value)}
                    className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                >
                    <option value="">전체 플랫폼</option>
                    <option value="1">Revu</option>
                    <option value="2">Reviewnote</option>
                    <option value="3">DinnerQueen</option>
                    <option value="4">Seouloppa</option>
                </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">캠페인 지원 형태</label>
                <select
                    defaultValue={searchParams.get("campaign_type") || ""}
                    onChange={(e) => handleSelect("campaign_type", e.target.value)}
                    className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                >
                    <option value="">전체 종류</option>
                    <option value="VST">방문 (Visit)</option>
                    <option value="SHP">배송 (Delivery)</option>
                    <option value="PRS">기자단 (Reporter)</option>
                </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">홍보 미디어</label>
                <select
                    defaultValue={searchParams.get("media_type") || ""}
                    onChange={(e) => handleSelect("media_type", e.target.value)}
                    className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                >
                    <option value="">미디어 전체</option>
                    <option value="BP">네이버 블로그</option>
                    <option value="IP">인스타그램</option>
                    <option value="YP">유튜브</option>
                </select>
            </div>
            {/* 
      <div className="flex flex-col lg:ml-auto justify-end w-full md:w-auto mt-4 md:mt-0">
         <button onClick={() => router.push("/", { scroll: false })} className="text-sm font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-4 py-2.5 rounded-lg transition-colors">
            필터 초기화
         </button>
      </div> */}
        </div>
    )
}
