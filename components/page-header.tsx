import { strings } from "@/lib/strings"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: ReactNode
  description: ReactNode
  parent?: { href: string; label: ReactNode }
  badge?: ReactNode
  actions?: ReactNode
  embedded?: boolean
}

export function PageHeader({
  title,
  description,
  parent,
  badge,
  actions,
  embedded,
}: PageHeaderProps) {
  return (
    <header
      className="page-header"
      data-worker-page-header={embedded || undefined}
    >
      {parent && (
        <nav
          aria-label={strings.interface.breadcrumb}
          className="page-breadcrumb"
        >
          <Link href={parent.href} className="inline-flex items-center gap-2">
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            {parent.label}
          </Link>
        </nav>
      )}
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
