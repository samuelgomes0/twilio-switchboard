"use client"

import {
  AlertTriangle,
  ChevronRight,
  Filter,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
import { StoredInput } from "@/components/stored-input"
import { WarningBadge } from "@/components/warning-badge"
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
import { Button } from "@/components/ui/button"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type { AddParticularFilterEntry } from "@/features/taskrouter/types"
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Status = "idle" | "running" | "done" | "error"

interface EntryRow {
  workflowSid: string
  taskQueueSid: string
}

interface EntryError {
  workflowSid: string | null
  taskQueueSid: string | null
}

interface Summary {
  totalAdded: number
  totalSkipped: number
  totalErrors: number
}

interface HistoryEntry {
  ts: number
  workspaceSid: string
  filterName: string
  totalEntries: number
  totalAdded: number
  totalSkipped: number
  totalErrors: number
}

const HISTORY_KEY = "switchboard:add-particular-filter-history"
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i
const WW_SID_RE = /^WW[a-fA-F0-9]{32}$/i
const WQ_SID_RE = /^WQ[a-fA-F0-9]{32}$/i

const EMPTY_ROW: EntryRow = { workflowSid: "", taskQueueSid: "" }
const EMPTY_ERROR: EntryError = { workflowSid: null, taskQueueSid: null }

function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function pushHistory(entry: HistoryEntry) {
  try {
    const prev = readHistory()
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY))
    )
  } catch {}
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AddParticularFilterForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [filterName, setFilterName] = React.useState("")
  const [rows, setRows] = React.useState<EntryRow[]>([{ ...EMPTY_ROW }])
  const [rowErrors, setRowErrors] = React.useState<EntryError[]>([
    { ...EMPTY_ERROR },
  ])
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingEntries, setPendingEntries] = React.useState<
    AddParticularFilterEntry[]
  >([])
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [wsSidError, setWsSidError] = React.useState<string | null>(null)
  const [filterNameError, setFilterNameError] = React.useState<string | null>(
    null
  )
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const filledRows = rows.filter(
    (r) => r.workflowSid.trim() && r.taskQueueSid.trim()
  )
  const canSubmit =
    workspaceSid.trim().length > 0 &&
    filterName.trim().length > 0 &&
    filledRows.length > 0 &&
    status !== "running" &&
    !!activeEnvironment

  function addLog(level: LogEntry["level"], message: string) {
    setLogs((prev) => [...prev, createLogEntry(level, message)])
  }

  function reset() {
    setLogs([])
    setStatus("idle")
    setSummary(null)
    setWsSidError(null)
    setFilterNameError(null)
    setRowErrors(rows.map(() => ({ ...EMPTY_ERROR })))
  }

  function handleAbort() {
    abortRef.current?.abort()
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    setHistory([])
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }])
    setRowErrors((prev) => [...prev, { ...EMPTY_ERROR }])
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, j) => j !== i))
    setRowErrors((prev) => prev.filter((_, j) => j !== i))
  }

  function updateRow(i: number, field: keyof EntryRow, value: string) {
    setRows((prev) =>
      prev.map((r, j) => (j === i ? { ...r, [field]: value } : r))
    )
    if (rowErrors[i]?.[field]) {
      setRowErrors((prev) =>
        prev.map((e, j) => (j === i ? { ...e, [field]: null } : e))
      )
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    if (!WS_SID_RE.test(workspaceSid.trim())) {
      setWsSidError(strings.common.workspaceSidInvalid)
      return
    }
    setWsSidError(null)

    if (!filterName.trim()) {
      setFilterNameError(
        strings.taskrouter.addParticularFilter.filterNameRequired
      )
      return
    }
    setFilterNameError(null)

    const newErrors: EntryError[] = rows.map((r) => {
      const wfFilled = !!r.workflowSid.trim()
      const tqFilled = !!r.taskQueueSid.trim()

      if (!wfFilled && !tqFilled) return { ...EMPTY_ERROR }

      return {
        workflowSid: !wfFilled
          ? strings.taskrouter.addParticularFilter.workflowSidRequired
          : !WW_SID_RE.test(r.workflowSid.trim())
            ? strings.taskrouter.addParticularFilter.workflowSidInvalid
            : null,
        taskQueueSid: !tqFilled
          ? strings.taskrouter.addParticularFilter.taskQueueSidRequired
          : !WQ_SID_RE.test(r.taskQueueSid.trim())
            ? strings.taskrouter.addParticularFilter.taskQueueSidInvalid
            : null,
      }
    })

    if (newErrors.some((e) => e.workflowSid || e.taskQueueSid)) {
      setRowErrors(newErrors)
      return
    }
    setRowErrors(rows.map(() => ({ ...EMPTY_ERROR })))

    const valid: AddParticularFilterEntry[] = rows
      .map((r) => ({
        workflowSid: r.workflowSid.trim(),
        taskQueueSid: r.taskQueueSid.trim(),
      }))
      .filter((r) => r.workflowSid && r.taskQueueSid)

    setPendingEntries(valid)
    setConfirmOpen(true)
  }

  async function runSubmit() {
    if (!pendingEntries.length || !activeEnvironment) return

    reset()
    setStatus("running")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/taskrouter/add-particular-filter", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSid: workspaceSid.trim(),
          filterName: filterName.trim(),
          entries: pendingEntries,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })

      if (!res.ok || !res.body) {
        const text = await res.text()
        let message: string = strings.common.apiConnectionError
        try {
          const json = JSON.parse(text) as { error?: string }
          if (json.error) message = json.error
        } catch {
          // ignore
        }
        addLog("error", message)
        setStatus("error")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const event of events) {
          const dataLine = event.split("\n").find((l) => l.startsWith("data:"))
          if (!dataLine) continue

          try {
            const payload = JSON.parse(dataLine.slice(5).trim()) as {
              level: LogEntry["level"]
              message: string
              done?: boolean
              totalAdded?: number
              totalSkipped?: number
              totalErrors?: number
            }

            addLog(payload.level, payload.message)

            if (payload.done) {
              const totalAdded = payload.totalAdded ?? 0
              const totalSkipped = payload.totalSkipped ?? 0
              const totalErrors = payload.totalErrors ?? 0
              setSummary({ totalAdded, totalSkipped, totalErrors })
              setStatus(
                totalAdded === 0 && totalSkipped === 0 ? "error" : "done"
              )
              const entry: HistoryEntry = {
                ts: Date.now(),
                workspaceSid: workspaceSid.trim(),
                filterName: filterName.trim(),
                totalEntries: pendingEntries.length,
                totalAdded,
                totalSkipped,
                totalErrors,
              }
              pushHistory(entry)
              setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
            }
          } catch {
            // Invalid events are ignored because the stream can contain partial data.
          }
        }
      }

      setStatus((prev) => (prev !== "done" && prev !== "error" ? "done" : prev))
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        addLog("warning", strings.common.aborted)
        setStatus("idle")
        return
      }
      const message =
        err instanceof Error ? err.message : strings.common.unexpectedError
      addLog("error", message)
      setStatus("error")
    } finally {
      abortRef.current = null
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/taskrouter"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.taskrouter}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {strings.taskrouter.addParticularFilter.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Filter className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.taskrouter.addParticularFilter.title}
            </h1>
            <WarningBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.addParticularFilter.subtitle}
          </p>
        </div>
      </div>

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
                href="/settings/environments"
                className="underline underline-offset-2 hover:text-destructive"
              >
                {strings.common.noEnvironmentSelected.link}
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {/* Workspace SID */}
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.addParticularFilter.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(v) => {
              setWorkspaceSid(v)
              if (wsSidError) setWsSidError(null)
            }}
            placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            disabled={status === "running"}
          />
          {wsSidError && (
            <p className="text-xs text-destructive">{wsSidError}</p>
          )}
        </div>

        {/* Filter name */}
        <div className="space-y-2">
          <Label htmlFor="filterName">
            {strings.taskrouter.addParticularFilter.filterNameLabel}
          </Label>
          <Input
            id="filterName"
            value={filterName}
            onChange={(e) => {
              setFilterName(e.target.value)
              if (filterNameError) setFilterNameError(null)
            }}
            placeholder={
              strings.taskrouter.addParticularFilter.filterNamePlaceholder
            }
            disabled={status === "running"}
          />
          {filterNameError && (
            <p className="text-xs text-destructive">{filterNameError}</p>
          )}
        </div>

        {/* Workflow / Task Queue pairs */}
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_2.25rem] gap-2">
            <Label>
              {strings.taskrouter.addParticularFilter.workflowSidColLabel}
            </Label>
            <Label>
              {strings.taskrouter.addParticularFilter.taskQueueSidColLabel}
            </Label>
            <div />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="space-y-1">
                <div className="grid grid-cols-[1fr_1fr_2.25rem] items-start gap-2">
                  <div className="space-y-1">
                    <Input
                      value={row.workflowSid}
                      onChange={(e) =>
                        updateRow(i, "workflowSid", e.target.value)
                      }
                      placeholder="WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      disabled={status === "running"}
                      className={cn(
                        "font-mono text-xs",
                        rowErrors[i]?.workflowSid && "border-destructive"
                      )}
                    />
                    {rowErrors[i]?.workflowSid && (
                      <p className="text-xs text-destructive">
                        {rowErrors[i].workflowSid}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      value={row.taskQueueSid}
                      onChange={(e) =>
                        updateRow(i, "taskQueueSid", e.target.value)
                      }
                      placeholder="WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      disabled={status === "running"}
                      className={cn(
                        "font-mono text-xs",
                        rowErrors[i]?.taskQueueSid && "border-destructive"
                      )}
                    />
                    {rowErrors[i]?.taskQueueSid && (
                      <p className="text-xs text-destructive">
                        {rowErrors[i].taskQueueSid}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={status === "running" || rows.length === 1}
                    onClick={() => removeRow(i)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                    aria-label={strings.common.remove}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add row */}
          <button
            type="button"
            disabled={status === "running" || rows.length >= MAX_ITEMS}
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            {strings.taskrouter.addParticularFilter.addEntry}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canSubmit} className="gap-2">
            {status === "running" ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {strings.common.processing}
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                {strings.taskrouter.addParticularFilter.submit}
              </>
            )}
          </Button>

          {status === "running" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAbort}
              className="gap-2"
            >
              <Square className="size-3.5" />
              {strings.common.cancel}
            </Button>
          )}

          {(logs.length > 0 || status !== "idle") && status !== "running" && (
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="gap-2"
            >
              <RotateCcw className="size-3.5" />
              {strings.common.clear}
            </Button>
          )}
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.taskrouter.addParticularFilter.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.taskrouter.addParticularFilter.confirmDescription(
                filterName.trim(),
                pendingEntries.length,
                workspaceSid.trim()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runSubmit()
              }}
            >
              {strings.taskrouter.addParticularFilter.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Summary banner */}
      {summary && (status === "done" || status === "error") && (
        <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {strings.taskrouter.addParticularFilter.summary.added(
              summary.totalAdded
            )}
          </span>
          {summary.totalSkipped > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="text-muted-foreground">
                {strings.taskrouter.addParticularFilter.summary.skipped(
                  summary.totalSkipped
                )}
              </span>
            </>
          )}
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="text-destructive">
                {strings.taskrouter.addParticularFilter.summary.errors(
                  summary.totalErrors
                )}
              </span>
            </>
          )}
        </div>
      )}

      {/* Log output */}
      {logs.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {strings.common.logOfOperations}
          </p>
          <LogOutput entries={logs} />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <RecentHistory onClear={clearHistory}>
          {history.map((h, i) => (
            <RecentHistoryItem key={i}>
              <span className="tabular-nums">{fmtTs(h.ts)}</span>
              {" — "}
              <span className="font-mono break-all select-text">
                {h.workspaceSid}
              </span>
              {" — "}
              <span className="font-semibold text-foreground">
                {strings.taskrouter.addParticularFilter.history.item(
                  h.filterName,
                  h.totalAdded
                )}
              </span>
              {h.totalSkipped > 0 &&
                strings.taskrouter.addParticularFilter.history.itemSkipped(
                  h.totalSkipped
                )}
              {h.totalErrors > 0 &&
                strings.taskrouter.addParticularFilter.history.itemErrors(
                  h.totalErrors
                )}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
