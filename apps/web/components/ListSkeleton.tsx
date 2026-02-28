export default function ListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col h-[480px]">
                    <div className="h-60 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div className="p-6 flex flex-col flex-1 gap-4">
                        <div className="h-7 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-7 bg-slate-100 rounded-full w-1/2 animate-pulse"></div>
                        <div className="flex gap-2 mt-4">
                            <div className="h-6 bg-slate-50 rounded-md w-16 animate-pulse"></div>
                            <div className="h-6 bg-slate-50 rounded-md w-20 animate-pulse"></div>
                        </div>
                        <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-50">
                            <div className="flex flex-col gap-2">
                                <div className="h-3 bg-slate-50 rounded-full w-12 animate-pulse"></div>
                                <div className="h-5 bg-slate-100 rounded-full w-24 animate-pulse"></div>
                            </div>
                            <div className="h-10 bg-slate-100 rounded-xl w-28 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
