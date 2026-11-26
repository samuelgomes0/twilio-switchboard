import type { ReactNode } from "react"

interface PageHeaderProps {
  title: ReactNode
  description: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  embedded?: boolean
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  embedded,
}: PageHeaderProps) {
  return (
    <header
      className="page-header"
      data-worker-page-header={embedded || undefined}
    >
      <div className="page-heading-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1>{title}</h1>
            {badge}
          </div>
          <p className="page-description">{description}</p>
        </div>
        {actions && <div className="page-heading-actions">{actions}</div>}
      </div>
    </header>
  )
}
