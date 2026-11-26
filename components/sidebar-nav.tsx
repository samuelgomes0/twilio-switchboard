"use client"

import {
  AtSign,
  BookUser,
  ChevronDown,
  FileSearch2,
  Hash,
  LayoutDashboard,
  Network,
  MessageSquare,
  MessageSquareOff,
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

const taskrouterNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.taskrouter.searchTasks.label,
    href: "/taskrouter/search-tasks-by-sid-or-number",
    icon: Search,
  },
  {
    label: strings.taskrouter.workerManagement.title,
    href: "/taskrouter/manage-workers",
    icon: Settings2,
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
  area,
  items,
  icon: Icon,
  pathname,
  onNavigate,
  collapsed,
}: {
  label: string
  area: string
  items: NavItem[]
  icon: React.ElementType
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const [choice, setChoice] = React.useState({ path: "", expanded: false })
  const expanded =
    choice.path === pathname
      ? choice.expanded
      : pathname.startsWith(`/${area}/`) ||
        (pathname === "/" &&
          (area === "conversations" || area === "taskrouter"))
  const id = React.useId()
  if (items.length === 1) {
    const item = items[0]
    return (
      <section className="nav-group">
        <Link
          href={item.href}
          onClick={onNavigate}
          className="nav-link"
          aria-label={`${label}: ${item.label}`}
          title={collapsed ? `${label}: ${item.label}` : undefined}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          <Icon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="nav-label">{label}</span>
        </Link>
      </section>
    )
  }
  return (
    <section className="nav-group">
      <div
        className="nav-group-row"
        data-active={pathname.startsWith(`/${area}/`)}
      >
        {collapsed ? (
          <Link
            href={`/?area=${area}`}
            onClick={onNavigate}
            className="nav-group-link"
            aria-label={label}
            title={label}
          >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="nav-label">{label}</span>
          </Link>
        ) : (
          <button
            type="button"
            className="nav-group-link w-full text-left"
            aria-label={strings.interface.expandNavigation(label)}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setChoice({ path: pathname, expanded: !expanded })}
          >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="nav-label">{label}</span>
            <ChevronDown
              aria-hidden="true"
              className={
                expanded ? "ml-auto size-3 rotate-180" : "ml-auto size-3"
              }
            />
          </button>
        )}
      </div>
      <div id={id} hidden={!expanded} className="nav-children">
        {items.map(({ label, href, icon: ItemIcon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="nav-link"
            aria-current={pathname === href ? "page" : undefined}
          >
            <ItemIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
export function getNavigationTrail(pathname: string) {
  const groups = [
    {
      href: "/?area=conversations",
      prefix: "/conversations/",
      label: strings.sidebar.sections.conversations,
      items: conversationsNavItems,
    },
    {
      href: "/?area=taskrouter",
      prefix: "/taskrouter/",
      label: strings.sidebar.sections.taskrouter,
      items: taskrouterNavItems,
    },
    {
      href: "/?area=numbers",
      prefix: "/numbers/",
      label: strings.sidebar.sections.numbers,
      items: numbersNavItems,
    },
    {
      href: "/settings",
      prefix: "/settings/",
      label: strings.sidebar.sections.settings,
      items: configNavItems,
    },
  ]
  const group = groups.find(
    (item) => pathname === item.href || pathname.startsWith(item.prefix)
  )
  if (!group) return []
  const item = group.items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  return item ? [group, item] : [group]
}

export function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const pathname = usePathname()
  return (
    <div className="navigation-panel">
      <Link
        href="/"
        className="nav-brand"
        aria-label={strings.sidebar.title}
        onClick={onNavigate}
      >
        <span className="nav-brand-mark">
          <Network aria-hidden="true" className="size-4" />
        </span>
        <span className="nav-brand-copy">{strings.sidebar.title}</span>
      </Link>
      <nav
        className="nav-content"
        aria-label={strings.sidebar.navigationAriaLabel}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="nav-link"
          aria-label={strings.interface.home}
          title={collapsed ? strings.interface.home : undefined}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <LayoutDashboard aria-hidden="true" className="size-3.5" />
          <span className="nav-label">{strings.interface.home}</span>
        </Link>
        <NavSection
          label={strings.sidebar.sections.conversations}
          area="conversations"
          items={conversationsNavItems}
          icon={MessageSquare}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.taskrouter}
          area="taskrouter"
          items={taskrouterNavItems}
          icon={Workflow}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          label={strings.sidebar.sections.numbers}
          area="numbers"
          items={numbersNavItems}
          icon={Hash}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>
      <div className="nav-footer">
        <Link
          href="/settings"
          className="nav-link"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          aria-label={strings.sidebar.configureEnvironments}
          title={collapsed ? strings.sidebar.configureEnvironments : undefined}
          onClick={onNavigate}
        >
          <Settings2 aria-hidden="true" className="size-3.5" />
          <span className="nav-label">
            {strings.sidebar.configureEnvironments}
          </span>
        </Link>
      </div>
    </div>
  )
}
