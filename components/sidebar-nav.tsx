"use client"

import {
  AtSign,
  BookUser,
  ChevronDown,
  FileSearch2,
  Filter,
  GitBranch,
  Hash,
  LayoutDashboard,
  ListX,
  MapPin,
  MessageSquare,
  MessageSquareOff,
  Phone,
  Search,
  Settings2,
  SlidersHorizontal,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { strings } from "@/lib/strings"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const conversationsNavItems: NavItem[] = [
  {
    label: strings.conversations.consult.title,
    href: "/conversations/consult-by-sid",
    icon: FileSearch2,
  },
  {
    label: strings.sidebar.nav.conversations.fetchByParticipant.label,
    href: "/conversations/search-by-number",
    icon: AtSign,
  },
  {
    label: strings.sidebar.nav.conversations.close.label,
    href: "/conversations/close-by-number",
    icon: MessageSquareOff,
  },
]

const flexNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.flex.createAddressConfig.label,
    href: "/flex/create-conversation-address",
    icon: MapPin,
  },
]

const taskrouterNavItems: NavItem[] = [
  {
    label: strings.taskrouter.workerManagement.title,
    href: "/taskrouter/manage-workers",
    icon: Settings2,
  },
  {
    label: strings.sidebar.nav.taskrouter.searchTasks.label,
    href: "/taskrouter/search-tasks-by-sid-or-number",
    icon: Search,
  },
  {
    label: strings.sidebar.nav.taskrouter.createWorkflow.label,
    href: "/taskrouter/create-workflow-from-csv",
    icon: GitBranch,
  },
  {
    label: strings.sidebar.nav.taskrouter.cancelQueueTasks.label,
    href: "/taskrouter/cancel-queue-tasks-and-close-conversations",
    icon: ListX,
  },
  {
    label: strings.sidebar.nav.taskrouter.addParticularFilter.label,
    href: "/taskrouter/add-business-rule-filter",
    icon: Filter,
  },
]

const numbersNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.numbers.listNumbers.label,
    href: "/numbers/list-messaging-numbers",
    icon: Hash,
  },
]

const configNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.config.manageEnvironments.label,
    href: "/settings/manage-environments",
    icon: Settings2,
  },
  {
    label: strings.sidebar.nav.config.manageContacts.label,
    href: "/settings/manage-contacts",
    icon: BookUser,
  },
  {
    label: strings.sidebar.nav.config.manageVariables.label,
    href: "/settings/manage-variables",
    icon: SlidersHorizontal,
  },
]

function NavSection({
  label,
  href,
  items,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  label: string
  href: string
  items: NavItem[]
  icon: React.ElementType
  pathname: string
  onNavigate?: () => void
}) {
  const [choice, setChoice] = React.useState({ path: "", expanded: false })
  const expanded =
    choice.path === pathname
      ? choice.expanded
      : pathname.startsWith(href) ||
        (pathname === "/" &&
          (href === "/conversations" || href === "/taskrouter"))
  const id = React.useId()
  return (
    <section className="nav-group">
      <div className="nav-group-row" data-active={pathname.startsWith(href)}>
        <Link
          href={href}
          onClick={onNavigate}
          className="nav-group-link"
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{label}</span>
        </Link>
        <button
          type="button"
          className="nav-expand"
          aria-label={strings.interface.expandNavigation(label)}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setChoice({ path: pathname, expanded: !expanded })}
        >
          <ChevronDown
            aria-hidden="true"
            className={expanded ? "size-3 rotate-180" : "size-3"}
          />
        </button>
      </div>
      <div id={id} hidden={!expanded} className="nav-children">
        {items.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="nav-link"
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  )
}
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="navigation-panel">
      <Link href="/" className="nav-brand" onClick={onNavigate}>
        <span className="nav-brand-mark">
          <Phone aria-hidden="true" className="size-3.5" />
        </span>
        {strings.sidebar.title}
      </Link>
      <nav
        className="nav-content"
        aria-label={strings.sidebar.navigationAriaLabel}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="nav-link"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <LayoutDashboard aria-hidden="true" className="size-3.5" />
          {strings.interface.home}
        </Link>
        <NavSection
          label={strings.sidebar.sections.conversations}
          href="/conversations"
          items={conversationsNavItems}
          icon={MessageSquare}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.taskrouter}
          href="/taskrouter"
          items={taskrouterNavItems}
          icon={Workflow}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.numbers}
          href="/numbers"
          items={numbersNavItems}
          icon={Hash}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.flex}
          href="/flex"
          items={flexNavItems}
          icon={MapPin}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.settings}
          href="/settings"
          items={configNavItems}
          icon={Settings2}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>
      <div className="nav-footer">
        <Link
          href="/settings/manage-environments"
          className="nav-link"
          onClick={onNavigate}
        >
          <Settings2 aria-hidden="true" className="size-3.5" />
          {strings.sidebar.configureEnvironments}
        </Link>
      </div>
    </div>
  )
}
