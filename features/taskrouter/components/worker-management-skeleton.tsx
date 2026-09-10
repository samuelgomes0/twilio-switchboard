import { Card } from "@/components/ui/card"
import { strings } from "@/lib/strings"

function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-muted motion-safe:animate-pulse ${className}`}
    />
  )
}

export function WorkerManagementSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-3xl">
      <span className="sr-only">
        {strings.taskrouter.workerManagement.loading}
      </span>
      <div aria-hidden="true">
        <div className="mb-5 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-3.5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="mb-5 h-9 w-full" />
        <Skeleton className="mb-5 h-11 w-full rounded-lg" />
        <Card className="space-y-3 p-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </Card>
      </div>
    </div>
  )
}
