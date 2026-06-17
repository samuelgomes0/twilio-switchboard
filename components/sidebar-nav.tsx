"use client"

import {
  AlertTriangle,
  AtSign,
  BookUser,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSearch2,
  Filter,
  GitBranch,
  Hash,
  ListX,
  MapPin,
  Menu,
  MessageSquareOff,
  Phone,
  Search,
  Settings2,
  SlidersHorizontal,
  User,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const conversationsNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.conversations.fetch.label,
    href: "/conversations/fetch",
    icon: FileSearch2,
  },
  {
    label: strings.sidebar.nav.conversations.fetchByParticipant.label,
    href: "/conversations/fetch-by-participant",
    icon: AtSign,
  },
  {
    label: strings.sidebar.nav.conversations.close.label,
    href: "/conversations/close",
    icon: MessageSquareOff,
  },
]

const flexNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.flex.createAddressConfig.label,
    href: "/flex/create-address-config",
    icon: MapPin,
  },
]

const taskrouterNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.taskrouter.searchTasks.label,
    href: "/taskrouter/search-tasks",
    icon: Search,
  },
  {
    label: strings.sidebar.nav.taskrouter.assignWorkers.label,
    href: "/taskrouter/assign-workers",
    icon: UserPlus,
  },
  {
    label: strings.sidebar.nav.taskrouter.fetchWorker.label,
    href: "/taskrouter/fetch-worker",
    icon: User,
  },
  {
    label: strings.sidebar.nav.taskrouter.createWorkflow.label,
    href: "/taskrouter/create-workflow",
    icon: GitBranch,
  },
  {
    label: strings.sidebar.nav.taskrouter.cancelQueueTasks.label,
    href: "/taskrouter/cancel-queue-tasks",
    icon: ListX,
  },
  {
    label: strings.sidebar.nav.taskrouter.addParticularFilter.label,
    href: "/taskrouter/add-particular-filter",
    icon: Filter,
  },
]

const numbersNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.numbers.listNumbers.label,
    href: "/numbers/list",
    icon: Hash,
  },
]

const configNavItems: NavItem[] = [
  {
    label: strings.sidebar.nav.config.manageEnvironments.label,
    href: "/settings/environments",
    icon: Settings2,
  },
  {
    label: strings.sidebar.nav.config.manageContacts.label,
    href: "/settings/contacts",
    icon: BookUser,
  },
  {
    label: strings.sidebar.nav.config.manageVariables.label,
    href: "/settings/variables",
    icon: SlidersHorizontal,
  },
]

function isPathActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function NavSection({
  label,
  href,
  items,
  pathname,
  onNavigate,
}: {
  label: string
  href?: string
  items: NavItem[]
  pathname: string
  onNavigate: () => void
}) {
  const sectionActive = href ? isPathActive(pathname, href) : false

  const header = href ? (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={sectionActive ? "page" : undefined}
      className={cn(
        "group mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        sectionActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <span className="flex-1 truncate text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
    </Link>
  ) : (
    <div className="mt-4 px-3 py-2">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )

  return (
    <>
      {header}
      {items.map((item) => {
        const Icon = item.icon
        const isActive = isPathActive(pathname, item.href, true)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive
                  ? "text-sidebar-primary"
                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )}
            />
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

function SidebarNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { environments, activeEnvironment, setActive } = useEnvironment()

  function closeMenu() {
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile toggle — hidden while sidebar is open (backdrop handles close) */}
      {!mobileOpen && (
        <button
          type="button"
          className="fixed top-4 left-4 z-50 flex size-9 items-center justify-center rounded-lg border border-border bg-card shadow-sm md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label={strings.sidebar.toggleLabel}
          aria-expanded={false}
        >
          <Menu className="size-4" />
        </button>
      )}

      {/* Backdrop */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5 transition-opacity hover:opacity-80"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Phone className="size-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            {strings.sidebar.title}
          </span>
        </Link>

        {/* Navigation */}
        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2">
          <NavSection
            label={strings.sidebar.sections.conversations}
            href="/conversations"
            items={conversationsNavItems}
            pathname={pathname}
            onNavigate={closeMenu}
          />
          <NavSection
            label={strings.sidebar.sections.flex}
            href="/flex"
            items={flexNavItems}
            pathname={pathname}
            onNavigate={closeMenu}
          />
          <NavSection
            label={strings.sidebar.sections.numbers}
            href="/numbers"
            items={numbersNavItems}
            pathname={pathname}
            onNavigate={closeMenu}
          />
          <NavSection
            label={strings.sidebar.sections.taskrouter}
            href="/taskrouter"
            items={taskrouterNavItems}
            pathname={pathname}
            onNavigate={closeMenu}
          />
          <NavSection
            label={strings.sidebar.sections.settings}
            href="/settings"
            items={configNavItems}
            pathname={pathname}
            onNavigate={closeMenu}
          />
        </nav>

        {/* Environment selector */}
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <p className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {strings.sidebar.environment}
          </p>
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              {activeEnvironment ? (
                <button
                  type="button"
                  className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    <span className="flex-1 truncate text-xs font-medium text-sidebar-foreground">
                      {activeEnvironment.name}
                    </span>
                    <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="truncate pl-5 font-mono text-[10px] text-muted-foreground">
                    {activeEnvironment.accountSid.slice(0, 8)}...
                  </p>
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-left transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3 shrink-0 text-destructive" />
                    <span className="flex-1 truncate text-xs font-medium text-destructive">
                      {strings.sidebar.noEnvironment}
                    </span>
                    <ChevronDown className="size-3 shrink-0 text-destructive/60" />
                  </div>
                </button>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width]"
            >
              {environments.length === 0 ? (
                <>
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    {strings.sidebar.noEnvironmentRegistered}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/environments" onClick={closeMenu}>
                      <Settings2 className="size-3.5 shrink-0" />
                      {strings.sidebar.configureEnvironments}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                environments.map((env) => {
                  const isActive = env.id === activeEnvironment?.id
                  return (
                    <DropdownMenuItem
                      key={env.id}
                      onSelect={() => setActive(env.id)}
                      className={cn(isActive && "font-medium")}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs">{env.name}</span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {env.accountSid.slice(0, 8)}...
                        </span>
                      </div>
                      {isActive && (
                        <Check className="size-3.5 shrink-0 text-emerald-500" />
                      )}
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {strings.sidebar.footer.toggleThemePress}{" "}
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">
              {strings.sidebar.footer.toggleThemeKey}
            </kbd>{" "}
            {strings.sidebar.footer.toggleThemeHint}
          </p>
        </div>
      </aside>
    </>
  )
}

export { SidebarNav }
