import { strings } from "@/lib/strings"

export function PageLoading() {
  return (
    <div role="status" className="workspace-page">
      <span className="sr-only">{strings.common.loadingPage}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {/* Header */}
        <div className="mb-8">
          <div className="h-7 w-44 rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-muted" />
        </div>

        {/* Card grid */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-4 border-b border-border p-5"
            >
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
    </div>
  )
}
