"use client"

import { PageHeader } from "@/components/page-header"

import { ActionBar } from "@/components/action-bar"
import { ActionButton } from "@/components/action-button"
import { InputActions } from "@/components/input-actions"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Hash,
  Loader2,
} from "lucide-react"
import * as React from "react"

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/search-input"
import { useEnvironment } from "@/features/environments/context"
import type { NumberRecord, PhoneNumberService } from "@/features/numbers/types"
import { strings } from "@/lib/strings"

type ServiceFilter = "all" | PhoneNumberService
type SortField = "friendlyName" | "service"
type SortDir = "asc" | "desc"

const s = strings.numbers.list

const SERVICE_FILTER_OPTIONS: { value: ServiceFilter; label: string }[] = [
  { value: "all", label: s.table.filterAll },
  { value: "Conversations", label: s.table.filterConversations },
  { value: "Programmable Chat", label: s.table.filterPchat },
]

function serviceLabel(service: PhoneNumberService): string {
  return service === "Conversations"
    ? s.table.filterConversations
    : s.table.filterPchat
}

function SortIcon({
  field,
  current,
  dir,
}: {
  field: SortField
  current: SortField
  dir: SortDir
}) {
  if (field !== current) return <ChevronsUpDown className="size-3 opacity-40" />
  return dir === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  )
}

export function ListNumbersForm() {
  const { activeEnvironment } = useEnvironment()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<NumberRecord[] | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const [serviceFilter, setServiceFilter] = React.useState<ServiceFilter>("all")
  const [search, setSearch] = React.useState("")
  const [sortField, setSortField] = React.useState<SortField>("friendlyName")
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")

  async function runFetch() {
    if (!activeEnvironment) return
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch("/api/numbers/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const json = (await res.json()) as {
        numbers: NumberRecord[]
        error?: string
      }
      if (!res.ok || json.error) {
        setError(json.error ?? strings.common.unknown)
        return
      }
      setResults(json.numbers)
    } catch {
      setError(strings.common.networkError)
    } finally {
      setLoading(false)
    }
  }

  function exportCsv() {
    if (!results) return
    const header = [
      s.table.colMark,
      s.table.colNumber,
      s.table.colService,
      s.table.colSid,
    ]
    const rows = results.map((r) => [
      `"${r.friendlyName.replace(/"/g, '""')}"`,
      r.phoneNumber,
      serviceLabel(r.service),
      r.id,
    ])
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${s.table.exportFilename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportExcel() {
    const XLSX = await import("xlsx")
    if (!results) return
    const data = results.map((r) => ({
      [s.table.colMark]: r.friendlyName,
      [s.table.colNumber]: r.phoneNumber,
      [s.table.colService]: serviceLabel(r.service),
      [s.table.colSid]: r.id,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, s.table.sheetName)
    const wbout = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayBuffer
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${s.table.exportFilename}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const displayedResults = React.useMemo(() => {
    if (!results) return null

    let filtered = results

    if (serviceFilter !== "all") {
      filtered = filtered.filter((r) => r.service === serviceFilter)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.friendlyName.toLowerCase().includes(q) ||
          r.phoneNumber.toLowerCase().includes(q)
      )
    }

    return [...filtered].sort((a, b) => {
      const aVal = sortField === "service" ? a.service : a.friendlyName
      const bVal = sortField === "service" ? b.service : b.friendlyName
      const cmp = aVal.localeCompare(bVal, "pt-BR")
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [results, serviceFilter, search, sortField, sortDir])

  const isFiltered = serviceFilter !== "all" || search.trim() !== ""

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={s.title}
        description={s.subtitle}
        parent={{ href: "/numbers", label: strings.sidebar.sections.numbers }}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      {/* Fetch button (idle state) */}
      {results === null && !loading && (
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!activeEnvironment}
          className="gap-2"
        >
          <Hash className="size-3.5" />
          {s.submit}
        </Button>
      )}

      {/* Loading */}
      {loading && (
        <div
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {strings.common.processing}
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{s.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {s.confirmDescription(activeEnvironment?.name ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runFetch()
              }}
            >
              {s.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {displayedResults !== null && (
        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_FILTER_OPTIONS.map((opt) => (
                <button
                  aria-pressed={serviceFilter === opt.value}
                  key={opt.value}
                  type="button"
                  onClick={() => setServiceFilter(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    serviceFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <InputActions>
              <div className="w-full min-w-0 sm:flex-1">
                <SearchInput
                  aria-label={s.table.searchLabel}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={s.table.searchPlaceholder}
                />
              </div>
              <ActionBar>
                <ActionButton
                  action="refresh"
                  onClick={() => setConfirmOpen(true)}
                >
                  {strings.common.refresh}
                </ActionButton>
                <DropdownMenuRoot>
                  <DropdownMenuTrigger asChild>
                    <ActionButton action="export" type="button">
                      {s.table.export}
                      <ChevronDown className="size-3.5" />
                    </ActionButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={exportCsv}>
                      {s.table.exportCsv}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportExcel}>
                      {s.table.exportExcel}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuRoot>
              </ActionBar>
            </InputActions>
          </div>

          <p className="text-xs text-muted-foreground">
            {strings.interface.exportScope}
          </p>
          {/* Count */}
          <p className="text-xs text-muted-foreground">
            {isFiltered
              ? s.table.countFiltered(displayedResults.length, results!.length)
              : s.table.count(displayedResults.length)}
          </p>

          {/* Table */}
          {displayedResults.length === 0 ? (
            <div className="rounded-lg border border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {results!.length === 0 ? s.table.empty : s.table.emptyFiltered}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card">
              <div className="max-h-[min(60svh,36rem)] overflow-auto">
                <table className="numbers-table w-full text-sm">
                  <caption className="sr-only">{s.title}</caption>
                  <thead className="sticky top-0 z-10 border-b border-border bg-card">
                    <tr>
                      <th
                        scope="col"
                        aria-sort={
                          sortField === "friendlyName"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className="px-4 py-3 text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("friendlyName")}
                          className="flex items-center gap-1 text-xs font-semibold tracking-normal text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {s.table.colMark}
                          <SortIcon
                            field="friendlyName"
                            current={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        <span className="text-xs font-semibold tracking-normal text-muted-foreground">
                          {s.table.colNumber}
                        </span>
                      </th>
                      <th
                        scope="col"
                        aria-sort={
                          sortField === "service"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className="px-4 py-3 text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort("service")}
                          className="flex items-center gap-1 text-xs font-semibold tracking-normal text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {s.table.colService}
                          <SortIcon
                            field="service"
                            current={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedResults.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium">{row.friendlyName}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {row.id}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-mono text-sm">
                          {row.phoneNumber}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              row.service === "Conversations"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {serviceLabel(row.service)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
