"use client"

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Hash,
  Loader2,
  Search,
} from "lucide-react"
import Link from "next/link"
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
import { Input } from "@/components/ui/input"
import type { NumberRecord, PhoneNumberService } from "@/features/numbers/types"
import { useEnvironment } from "@/features/environments/context"
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
        headers: {
          "x-twilio-account-sid": activeEnvironment.accountSid,
          "x-twilio-auth-token": activeEnvironment.authToken,
        },
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
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.common.networkError)
    } finally {
      setLoading(false)
    }
  }

  function exportCsv() {
    if (!results) return
    const header = [s.table.colMark, s.table.colNumber, s.table.colService, "SID"]
    const rows = results.map((r) => [
      `"${r.friendlyName.replace(/"/g, '""')}"`,
      r.phoneNumber,
      r.service,
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
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/numbers"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.numbers}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">{s.breadcrumb}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Hash className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </div>
      </div>

      {/* About */}
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {s.about}
      </p>

      {/* No environment warning */}
      {!activeEnvironment && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              {strings.common.noEnvironmentSelected.title}
            </p>
            <p className="mt-0.5 text-destructive/80">
              {strings.common.noEnvironmentSelected.message}{" "}
              <Link
                href="/settings"
                className="underline underline-offset-2 hover:text-destructive"
              >
                {strings.common.noEnvironmentSelected.link}
              </Link>
            </p>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
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
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {displayedResults !== null && (
        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1.5">
              {SERVICE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setServiceFilter(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    serviceFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative sm:w-56">
                <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={s.table.searchPlaceholder}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="shrink-0 gap-1.5"
              >
                <Download className="size-3.5" />
                {s.table.exportCsv}
              </Button>
            </div>
          </div>

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
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 border-b border-border bg-card">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort("friendlyName")}
                          className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground"
                        >
                          {s.table.colMark}
                          <SortIcon
                            field="friendlyName"
                            current={sortField}
                            dir={sortDir}
                          />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          {s.table.colNumber}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort("service")}
                          className="flex items-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground"
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
                        <td className="px-4 py-3">
                          <p className="font-medium">{row.friendlyName}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            {row.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
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
                            {row.service}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {s.submit}
          </button>
        </div>
      )}
    </div>
  )
}
