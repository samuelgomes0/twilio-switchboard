"use client"
import { CommandMenu } from "@/components/command-menu"
import { EnvironmentSelector } from "@/components/environment-selector"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { strings } from "@/lib/strings"
import { useEnvironment } from "@/features/environments/context"
import { Menu, SunMoon, X } from "lucide-react"
import { useTheme } from "next-themes"
import { Dialog } from "radix-ui"
import * as React from "react"
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { activeEnvironment, activeEnvironmentRevision } = useEnvironment()
  const { setTheme } = useTheme()
  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)")
    const closeOnDesktop = () => {
      if (media.matches) setMobileOpen(false)
    }
    media.addEventListener("change", closeOnDesktop)
    return () => media.removeEventListener("change", closeOnDesktop)
  }, [])
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {strings.interface.skip}
      </a>
      <aside className="desktop-navigation">
        <SidebarNav />
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
          <CommandMenu />
          <div className="ml-auto flex min-w-0 items-center gap-2">
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
          {children}
        </main>
      </div>
    </div>
  )
}
