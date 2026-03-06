export default function ListSkeleton({ layoutMode = "card" }: { layoutMode?: "card" | "list" }) {
  if (layoutMode === "list") {
    return (
      <div className="flex flex-col gap-3 w-full animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4">
              <div className="h-[130px] rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="col-span-2 lg:col-span-1 h-10 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 w-full animate-pulse">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
        >
          <div className="h-[132px] bg-slate-100 dark:bg-slate-800" />
          <div className="p-3.5 space-y-2.5">
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-9 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="col-span-2 h-9 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
