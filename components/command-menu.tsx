"use client"

import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/search-input"
import { conversationsTools } from "@/features/conversations/tools"
import { flexTools } from "@/features/flex/tools"
import { numbersTools } from "@/features/numbers/tools"
import { taskrouterTools } from "@/features/taskrouter/tools"
import { strings } from "@/lib/strings"
import { BookUser, Search, Settings2, SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog } from "radix-ui"
import * as React from "react"

const TOOLS = [
  ...conversationsTools,
  ...taskrouterTools,
  ...numbersTools,
  ...flexTools,
  {
    ...strings.environments.page.tools.manage,
    href: "/settings/manage-environments",
    icon: Settings2,
    available: true,
  },
  {
    ...strings.environments.page.tools.contacts,
    href: "/settings/manage-contacts",
    icon: BookUser,
    available: true,
  },
  {
    ...strings.environments.page.tools.variables,
    href: "/settings/manage-variables",
    icon: SlidersHorizontal,
    available: true,
  },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const matches = TOOLS.filter(
    (tool) =>
      tool.available &&
      `${tool.label} ${tool.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR"))
  )
  React.useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((previous) => !previous)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) setQuery("")
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="command-trigger search-control"
          aria-label={strings.interface.searchTools}
        >
          <Search aria-hidden="true" className="size-3.5" />
          <span>{strings.interface.searchTools}</span>
          <kbd aria-hidden="true">{strings.interface.searchShortcut}</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="command-overlay" />
        <Dialog.Content className="command-dialog" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">
            {strings.interface.searchTools}
          </Dialog.Title>
          <div className="command-input-row">
            <label htmlFor="command-search" className="sr-only">
              {strings.interface.searchTools}
            </label>
            <SearchInput
              id="command-search"
              aria-label={strings.interface.searchTools}
              placeholder={strings.interface.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && matches[0]) {
                  event.preventDefault()
                  router.push(matches[0].href)
                  setOpen(false)
                  setQuery("")
                }
              }}
            />
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={strings.common.cancel}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="command-results">
            {matches.length ? (
              matches.map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => {
                    setOpen(false)
                    setQuery("")
                  }}
                  className="command-result"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                {strings.interface.noToolsFound}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
