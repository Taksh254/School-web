export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-beige/30 rounded-xl" />
          <div className="h-4 w-64 bg-beige/20 rounded-xl" />
        </div>
        <div className="h-10 w-32 bg-beige/20 rounded-xl" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-soft-white rounded-2xl p-5 border border-beige/15 shadow-soft space-y-3">
            <div className="w-9 h-9 rounded-xl bg-beige/20" />
            <div className="h-4 w-20 bg-beige/20 rounded-lg" />
            <div className="h-7 w-16 bg-beige/30 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table/content skeleton */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-4">
        <div className="h-10 w-full bg-beige/15 rounded-xl" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-beige/10 last:border-0">
            <div className="w-9 h-9 rounded-lg bg-beige/20 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-beige/20 rounded-lg" />
              <div className="h-3 w-24 bg-beige/15 rounded-lg" />
            </div>
            <div className="h-6 w-16 bg-beige/20 rounded-full" />
            <div className="flex gap-1">
              <div className="w-7 h-7 rounded-lg bg-beige/15" />
              <div className="w-7 h-7 rounded-lg bg-beige/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
