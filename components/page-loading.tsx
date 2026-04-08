export function PageLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-44 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-md bg-muted" />
      </div>

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="size-9 rounded-lg bg-muted" />
            </div>
            <div className="mb-4 h-4 w-3/4 rounded-md bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-md bg-muted" />
              <div className="h-3 w-5/6 rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
