export default function ListSkeleton() {
    return (
        <div className="flex flex-col gap-12">
            {/* Trending Skeleton Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-24 h-6 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="w-48 h-8 bg-slate-200 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <CardSkeleton key={`trend-skel-${i}`} />
                    ))}
                </div>
            </div>

            {/* Main List Skeleton Section */}
            <div className="flex flex-col gap-8 mt-12">
                <div className="flex justify-between items-end">
                    <div className="w-40 h-8 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <CardSkeleton key={`main-skel-${i}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function CardSkeleton() {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="h-64 bg-slate-200 animate-pulse relative">
                <div className="absolute top-5 left-5 w-20 h-8 bg-slate-300 rounded-2xl" />
            </div>
            <div className="p-8 flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="w-20 h-4 bg-slate-100 rounded-md animate-pulse self-center" />
                </div>
                <div className="w-full h-8 bg-slate-200 rounded-xl animate-pulse" />
                <div className="w-3/4 h-8 bg-slate-200 rounded-xl animate-pulse" />
                <div className="mt-4 w-1/2 h-4 bg-slate-100 rounded-md animate-pulse" />
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <div className="w-16 h-3 bg-slate-100 rounded-md animate-pulse" />
                        <div className="w-24 h-6 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="w-28 h-12 bg-slate-900/10 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
