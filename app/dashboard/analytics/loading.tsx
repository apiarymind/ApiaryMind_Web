export default function Loading() {
  return (
    <div className="min-h-screen pb-8 p-4 md:p-6 space-y-6">
      <div className="h-10 w-2/3 bg-theme-card rounded-xl animate-pulse" />
      <div className="h-4 w-1/3 bg-theme-card rounded-lg animate-pulse" />
      <div className="rounded-2xl border border-theme-card overflow-hidden">
        <div className="h-12 bg-theme-card animate-pulse" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-14 border-t border-theme-card bg-theme-card/70 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
