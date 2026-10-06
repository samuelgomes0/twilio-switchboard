import { InputActions } from "@/components/input-actions"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
    />
  )
}

function ResultCardsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <Skeleton className="h-3 w-36" />
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-80 max-w-full" />
              <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-40 max-w-full rounded-md" />
              <Skeleton className="h-9 w-40 max-w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FetchByParticipantResultsSkeleton({
  announce = true,
}: {
  announce?: boolean
}) {
  return (
    <div
      role={announce ? "status" : undefined}
      className="mt-6 w-full max-w-3xl"
    >
      {announce && (
        <span className="sr-only">
          {strings.conversations.fetchByParticipant.loadingResults}
        </span>
      )}
      <ResultCardsSkeleton />
    </div>
  )
}

export function FetchByParticipantPageSkeleton() {
  return (
    <div role="status" className="workspace-page">
      <span className="sr-only">
        {strings.conversations.fetchByParticipant.loadingPage}
      </span>
      <div aria-hidden="true">
        <div className="mb-5 flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-3.5" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="mb-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="operation-form w-full max-w-3xl space-y-5 [&_[aria-hidden=true]]:bg-card">
          <div>
            <Skeleton className="mb-2 h-4 w-52 max-w-full" />
            <InputActions>
              <Skeleton className="h-9 w-full min-w-0 flex-1 rounded-md" />
              <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
            </InputActions>
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <div className="flex flex-wrap gap-1.5">
              {["w-13", "w-14", "w-15", "w-16"].map((width) => (
                <Skeleton key={width} className={cn("h-7", width)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
