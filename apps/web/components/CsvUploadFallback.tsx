"use client";

import { useState } from "react";

export default function CsvUploadFallback() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("CSV 파일을 먼저 선택해 주세요.");
      return;
    }
    setIsUploading(true);

    // 업로드 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 2000));

    alert("CSV 파일 업로드를 완료했습니다. (Fallback 모드)");
    setIsUploading(false);
    setFile(null);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900">수동 업로드(Fallback)</h3>
          <p className="text-sm text-amber-700 mt-1 mb-4">
            크롤러 수집이 실패했거나 API 장애가 있을 때 CSV 파일로 바로 데이터를 반영할 수 있는 대체 업로드입니다.
          </p>
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
              className={`shrink-0 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                !file || isUploading ? "bg-amber-200 text-amber-400 cursor-not-allowed" : "bg-amber-600 text-white hover:bg-amber-700 shadow-md"
              }`}
            >
              {isUploading ? "업로드 중..." : "CSV 업로드"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
