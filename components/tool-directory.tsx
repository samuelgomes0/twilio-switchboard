"use client"

import { SearchInput } from "@/components/search-input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { conversationsTools } from "@/features/conversations/tools"
import { taskrouterTools } from "@/features/taskrouter/tools"
import { numbersTools } from "@/features/numbers/tools"
import { strings } from "@/lib/strings"
import { ArrowUpRight, ChevronDown, Settings2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"

const s = strings.interface
const GROUPS = [
  {
    id: "conversations",
    label: strings.sidebar.sections.conversations,
    tools: conversationsTools,
  },
  {
    id: "taskrouter",
    label: strings.sidebar.sections.taskrouter,
    tools: taskrouterTools,
  },
  {
    id: "numbers",
    label: strings.sidebar.sections.numbers,
    tools: numbersTools,
  },
]
const TOOLS = GROUPS.flatMap((group) =>
  group.tools
    .filter((tool) => tool.available)
    .map((tool) => ({ ...tool, groupId: group.id, groupLabel: group.label }))
)

export function ToolDirectory({ initialArea = "" }: { initialArea?: string }) {
  const [query, setQuery] = React.useState("")
  const [area, setArea] = React.useState(
    GROUPS.some((group) => group.id === initialArea) ? initialArea : ""
  )
  const term = query.trim().toLocaleLowerCase("pt-BR")
  const matches = TOOLS.filter(
    (tool) =>
      (!area || tool.groupId === area) &&
      `${tool.label} ${tool.description} ${tool.groupLabel}`
        .toLocaleLowerCase("pt-BR")
        .includes(term)
  )

  return (
    <div className="workspace-page directory-page">
      <header className="directory-heading">
        <div>
          <h1>{s.homeTitle}</h1>
          <p>{s.homeDescription}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/settings/manage-environments">
            <Settings2 aria-hidden="true" className="size-3.5" />
            {s.configureEnvironment}
          </Link>
        </Button>
      </header>
      <section aria-labelledby="directory-title" className="directory-list">
        <div className="directory-toolbar">
          <h2 id="directory-title">{s.toolDirectory}</h2>
          <div className="directory-search">
            <label className="sr-only" htmlFor="directory-search">
              {s.searchTools}
            </label>
            <SearchInput
              id="directory-search"
              aria-label={s.searchTools}
              placeholder={s.toolSearch}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <label className="sr-only" htmlFor="directory-area">
            {s.filterArea}
          </label>
          <div className="directory-area-control">
            <Select
              id="directory-area"
              className="search-control"
              aria-label={s.filterArea}
              value={area}
              onChange={(event) => setArea(event.target.value)}
            >
              <option value="">{s.allAreas}</option>
              {GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </Select>
            <ChevronDown aria-hidden="true" className="directory-area-icon" />
          </div>
        </div>
        <div
          className="directory-table-scroll"
          role="region"
          aria-label={s.toolDirectory}
          tabIndex={0}
        >
          <table className="directory-table">
            <caption className="sr-only">{s.toolDirectory}</caption>
            <thead>
              <tr>
                <th scope="col">{s.toolColumn}</th>
                <th scope="col">{s.purposeColumn}</th>
                <th scope="col">{s.areaColumn}</th>
                <th scope="col">
                  <span className="sr-only">{s.openTool}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map(
                ({
                  href,
                  label,
                  description,
                  icon: Icon,
                  groupId,
                  groupLabel,
                }) => (
                  <tr key={href}>
                    <td>
                      <Link href={href} className="directory-tool-link">
                        <span className="directory-tool-icon">
                          <Icon aria-hidden="true" className="size-3.5" />
                        </span>
                        <span>{label}</span>
                      </Link>
                    </td>
                    <td className="directory-purpose">{description}</td>
                    <td>
                      <span className="directory-tag" data-area={groupId}>
                        {groupLabel}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={href}
                        className="directory-open"
                        aria-label={`${s.openTool}: ${label}`}
                      >
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        {!matches.length && (
          <p className="directory-empty" role="status">
            {s.emptyCatalog}
          </p>
        )}
        <footer className="directory-footer" role="status">
          {s.catalogCount(matches.length)}
        </footer>
      </section>
    </div>
  )
}
