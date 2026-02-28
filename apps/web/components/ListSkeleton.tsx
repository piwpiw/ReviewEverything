export default function ListSkeleton() {
    return (
        <div className="flex flex-col gap-10">
            {/* Trending skeleton */}
            <div>
                <div className="h-6 w-40 skeleton mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="h-40 skeleton rounded-none" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 w-16 skeleton" />
                                <div className="h-4 w-full skeleton" />
                                <div className="h-3 w-3/4 skeleton" />
                                <div className="h-7 w-full skeleton" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main grid skeleton */}
            <div>
                <div className="h-5 w-32 skeleton mb-5" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="h-40 skeleton rounded-none" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 w-20 skeleton" />
                                <div className="h-4 w-full skeleton" />
                                <div className="h-3 w-2/3 skeleton" />
                                <div className="h-3 w-full skeleton" />
                                <div className="h-7 w-full skeleton mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
