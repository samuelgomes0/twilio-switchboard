import { Card } from "@/components/ui/card"
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
          <Card key={index} className="space-y-3 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-64 max-w-full" />
                <Skeleton className="h-4 w-40 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-3 w-48 max-w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function FetchByParticipantResultsSkeleton() {
  return (
    <div role="status" className="mt-6">
      <span className="sr-only">
        {strings.conversations.fetchByParticipant.loadingResults}
      </span>
      <ResultCardsSkeleton />
    </div>
  )
}

export function FetchByParticipantPageSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-3xl">
      <span className="sr-only">
        {strings.conversations.fetchByParticipant.loadingPage}
      </span>
      <div aria-hidden="true">
        <div className="mb-5 flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-3.5" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <Skeleton className="mb-2 h-4 w-52" />
        <div className="flex gap-2">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-5 mb-2 h-4 w-20" />
        <div className="flex gap-2">
          {["w-13", "w-14", "w-15", "w-16"].map((width) => (
            <Skeleton key={width} className={cn("h-7", width)} />
          ))}
        </div>
      </div>
    </div>
  )
}
