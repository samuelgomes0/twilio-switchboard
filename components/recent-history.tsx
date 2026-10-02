import { ActionButton } from "@/components/action-button"
import type { ReactNode } from "react"

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
      className="history-section space-y-2"
      aria-label={strings.common.recentHistory.title}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {strings.common.recentHistory.title}
        </h2>
        <ActionButton action="clear" type="button" onClick={onClear}>
          {strings.common.clear}
        </ActionButton>
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
  const contentClassName = "history-item rounded-md"

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
