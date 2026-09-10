import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

export function RecentHistory({
  children,
  onClear,
}: {
  children: ReactNode
  onClear: () => void
}) {
  return (
    <section
      className="mt-8 space-y-2"
      aria-label={strings.common.recentHistory.title}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {strings.common.recentHistory.title}
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          {strings.common.clear}
        </Button>
      </div>
      <ul className="space-y-1">{children}</ul>
    </section>
  )
}

export function RecentHistoryItem({
  children,
  className,
  onSelect,
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  onSelect?: () => void
  ariaLabel?: string
}) {
  const contentClassName =
    "min-h-8 w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"

  return (
    <li className={cn(!onSelect && contentClassName, className)}>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={ariaLabel}
          className={contentClassName}
        >
          {children}
        </button>
      ) : (
        children
      )}
    </li>
  )
}
