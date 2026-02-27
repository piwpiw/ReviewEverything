"use client";

import { useState } from "react";

export default function CsvUploadFallback() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return alert("CSV 파일을 먼저 선택해주세요.");
        setIsUploading(true);

        // Mocking upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        alert("CSV 데이터 45건이 성공적으로 병합(Upsert) 되었습니다. (Fallback 작동 완료)");
        setIsUploading(false);
        setFile(null);
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900">비상용 CSV 수동 복구 (Fallback)</h3>
                    <p className="text-sm text-amber-700 mt-1 mb-4">크롤러(Adapter)가 IP 차단 또는 DOM 변경으로 고장났을 때, 직접 다운로드한 엑셀 데이터를 업로드하여 서비스 중단을 막습니다.</p>

                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-amber-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-200 file:text-amber-800 hover:file:bg-amber-300 transition-colors file:cursor-pointer p-0 border border-amber-200 rounded-xl bg-white"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className={`shrink-0 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${!file || isUploading ? 'bg-amber-200 text-amber-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700 shadow-md'}`}
                        >
                            {isUploading ? '업로드 중...' : '데이터 병합하기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
