export default function AppLoading() {
  return (
    <main className="page-shell py-8 md:py-10">
      <div className="space-y-3">
        <div className="h-8 w-56 skeleton rounded-xl" />
        <div className="h-4 w-80 max-w-full skeleton rounded-xl" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-44 rounded-2xl skeleton" />
        ))}
      </div>
    </main>
  );
}
