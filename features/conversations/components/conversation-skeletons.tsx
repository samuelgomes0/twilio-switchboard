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

export function ConversationPageSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-3xl">
      <span className="sr-only">
        {strings.conversations.consult.loadingPage}
      </span>
      <div aria-hidden="true">
        <div className="mb-5 flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <Skeleton className="mb-2 h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-3 w-64 max-w-full" />
      </div>
    </div>
  )
}

export function ConversationDetailsSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">
        {strings.conversations.consult.loadingDetails}
      </span>
      <Card aria-hidden="true" className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36 max-w-full" />
            </div>
          ))}
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <div className="border-t pt-4">
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="space-y-3 rounded-md bg-muted/40 p-4">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="ml-4 h-3 w-1/2" />
            <Skeleton className="ml-4 h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </Card>
      <Card aria-hidden="true" className="space-y-5 p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-64 max-w-full" />
        <div className="space-y-3 rounded-md bg-muted/40 p-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      </Card>
    </div>
  )
}

export function ConversationMessagesSkeleton() {
  return (
    <Card role="status" className="p-6">
      <span className="sr-only">
        {strings.conversations.consult.loadingMessages}
      </span>
      <div aria-hidden="true">
        <Skeleton className="mb-5 h-4 w-36" />
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn("space-y-2", index < 2 && "col-span-2")}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="space-y-4 rounded-xl bg-muted/30 p-3 sm:p-4">
          {[false, true, false, true].map((customer, index) => (
            <div
              key={index}
              className={cn("flex", customer ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "w-4/5 space-y-3 rounded-2xl border p-4 sm:w-2/3",
                  customer
                    ? "rounded-br-sm border-primary/10 bg-primary/5"
                    : "rounded-bl-sm bg-card"
                )}
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                {!customer && <Skeleton className="h-3 w-3/4" />}
                <Skeleton className="ml-auto h-2 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
