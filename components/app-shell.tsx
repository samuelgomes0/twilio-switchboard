"use client"
import { CommandMenu } from "@/components/command-menu"
import { EnvironmentSelector } from "@/components/environment-selector"
import { SidebarNav, getNavigationTrail } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { strings } from "@/lib/strings"
import { useEnvironment } from "@/features/environments/context"
import { STORAGE_ERROR_EVENT } from "@/lib/browser-storage"
import { ChevronRight, Menu, PanelLeft, SunMoon, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Dialog } from "radix-ui"
import * as React from "react"
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()
  const trail = getNavigationTrail(pathname)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { activeEnvironment, activeEnvironmentRevision } = useEnvironment()
  const [storageError, setStorageError] = React.useState(false)
  const { setTheme } = useTheme()
  React.useEffect(() => {
    function toggleSidebar(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        if (
          event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
        )
          return
        event.preventDefault()
        if (window.matchMedia("(min-width: 48rem)").matches)
          setCollapsed((value) => !value)
        else setMobileOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", toggleSidebar)
    return () => window.removeEventListener("keydown", toggleSidebar)
  }, [])
  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 48rem)")
    const closeOnDesktop = () => {
      if (media.matches) setMobileOpen(false)
    }
    media.addEventListener("change", closeOnDesktop)
    return () => media.removeEventListener("change", closeOnDesktop)
  }, [])
  React.useEffect(() => {
    const showStorageError = () => setStorageError(true)
    window.addEventListener(STORAGE_ERROR_EVENT, showStorageError)
    return () =>
      window.removeEventListener(STORAGE_ERROR_EVENT, showStorageError)
  }, [])
  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <a href="#main-content" className="skip-link">
        {strings.interface.skip}
      </a>
      <aside className="desktop-navigation">
        <SidebarNav collapsed={collapsed} />
      </aside>
      <div className="shell-main">
        <header className="shell-header">
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mobile-navigation-trigger"
                aria-label={strings.sidebar.toggleLabel}
              >
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="mobile-dialog-overlay" />
              <Dialog.Content
                className="mobile-dialog-panel"
                aria-describedby={undefined}
              >
                <Dialog.Title className="sr-only">
                  {strings.sidebar.navigationAriaLabel}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    aria-label={strings.interface.closeNavigation}
                  >
                    <X aria-hidden="true" className="size-5" />
                  </Button>
                </Dialog.Close>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Button
            variant="ghost"
            size="icon"
            className="desktop-sidebar-trigger"
            aria-label={
              collapsed
                ? strings.interface.expandSidebar
                : strings.interface.collapseSidebar
            }
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelLeft aria-hidden="true" className="size-4" />
          </Button>
          <span className="header-separator" aria-hidden="true" />
          <nav
            className="shell-breadcrumb"
            aria-label={strings.interface.breadcrumb}
          >
            <Link href="/">{strings.interface.home}</Link>
            {trail.map((item, index) => (
              <React.Fragment key={item.href}>
                <ChevronRight
                  aria-hidden="true"
                  className="size-3 shrink-0 text-muted-foreground"
                />
                {index === trail.length - 1 ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </React.Fragment>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <CommandMenu />
            <EnvironmentSelector />
            <DropdownMenuRoot>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={strings.interface.theme}
                >
                  <SunMoon aria-hidden="true" className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <DropdownMenuItem
                    key={theme}
                    onSelect={() => setTheme(theme)}
                  >
                    {strings.interface[theme]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenuRoot>
          </div>
        </header>
        <main
          key={`${activeEnvironment?.id ?? "none"}:${activeEnvironmentRevision}`}
          id="main-content"
          tabIndex={-1}
          className="shell-content"
        >
          {storageError && (
            <div
              role="alert"
              className="mb-4 flex items-start justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <span>{strings.common.storageError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStorageError(false)}
              >
                {strings.common.dismiss}
              </Button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
