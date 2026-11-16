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
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
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
