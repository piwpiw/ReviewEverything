export default function ListSkeleton() {
    return (
        <div className="flex flex-col gap-10 w-full animate-pulse">
            {/* 큐레이션 영역 스켈레톤 */}
            <div>
                <div className="flex items-center gap-2 mb-6 ml-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="h-[180px] bg-slate-100 dark:bg-slate-800" />
                            <div className="p-5 space-y-4">
                                <div className="flex gap-2">
                                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
                                    <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                    <div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 메인 리스트 스켈레톤 */}
            <div>
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6 ml-2" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
                        >
                            <div className="h-[180px] bg-slate-100 dark:bg-slate-800" />
                            <div className="p-5 space-y-4">
                                <div className="flex gap-2">
                                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
                                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                </div>
                                <div className="pt-2 flex justify-between items-center">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
