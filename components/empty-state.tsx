import { Inbox } from "lucide-react"
import type { ReactNode } from "react"
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      <Inbox aria-hidden="true" className="mb-3 size-7 text-muted-foreground" />
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
