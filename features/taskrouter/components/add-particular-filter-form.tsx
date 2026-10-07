"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { Loader2, Play } from "lucide-react"
import * as React from "react"

import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
import { StoredInput } from "@/components/stored-input"
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
import { WarningBadge } from "@/components/warning-badge"

import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type { AddParticularFilterEntry } from "@/features/taskrouter/types"
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
import { environmentHistoryKey, pushHistory, readHistory } from "@/lib/operation-history"
import { consumeSseStream } from "@/lib/sse-reader"
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
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
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
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )
  const [wsSidError, setWsSidError] = React.useState<string | null>(null)
  const [filterNameError, setFilterNameError] = React.useState<string | null>(
    null
  )
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

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
      if (historyKey) localStorage.removeItem(historyKey)
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
      const res = await fetch("/api/taskrouter/add-business-rule-filter", {
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
      await consumeSseStream(reader, (payload) => {
          addLog(payload.level, payload.message)

          if (payload.done === true) {
            const totalAdded = typeof payload.totalAdded === "number" ? payload.totalAdded : 0
            const totalSkipped = typeof payload.totalSkipped === "number" ? payload.totalSkipped : 0
            const totalErrors = typeof payload.totalErrors === "number" ? payload.totalErrors : 0
            setSummary({ totalAdded, totalSkipped, totalErrors })
            setStatus(totalAdded === 0 && totalSkipped === 0 ? "error" : "done")
            const entry: HistoryEntry = {
              ts: Date.now(),
              workspaceSid: workspaceSid.trim(),
              filterName: filterName.trim(),
              totalEntries: pendingEntries.length,
              totalAdded,
              totalSkipped,
              totalErrors,
            }
            pushHistory(historyKey, entry)
            setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
          }
      })
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        addLog("warning", strings.common.aborted)
        setStatus("idle")
        return
      }
      const message = strings.common.unexpectedError
      addLog("error", message)
      setStatus("error")
    } finally {
      abortRef.current = null
    }
  }

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.taskrouter.addParticularFilter.title}
        description={strings.taskrouter.addParticularFilter.subtitle}
        parent={{
          href: "/taskrouter",
          label: strings.sidebar.sections.taskrouter,
        }}
        badge={<WarningBadge />}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      <form onSubmit={handleFormSubmit} className="operation-form form-grid">
        {/* Workspace SID */}
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.addParticularFilter.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            aria-describedby={wsSidError ? "filter-workspace-error" : undefined}
            aria-invalid={!!wsSidError}
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(v) => {
              setWorkspaceSid(v)
              if (wsSidError) setWsSidError(null)
            }}
            placeholder={strings.common.placeholders.workspaceSid}
            disabled={status === "running"}
          />
          {wsSidError && (
            <p id="filter-workspace-error" className="text-xs text-destructive">
              {wsSidError}
            </p>
          )}
        </div>

        {/* Filter name */}
        <div className="space-y-2">
          <Label htmlFor="filterName">
            {strings.taskrouter.addParticularFilter.filterNameLabel}
          </Label>
          <InputActions>
            <div className="min-w-0 flex-1">
              <Input
                id="filterName"
                aria-describedby={
                  filterNameError ? "filter-name-error" : undefined
                }
                aria-invalid={!!filterNameError}
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
            </div>
            <ActionBar>
              <ActionButton
                action="primary"
                aria-busy={status === "running"}
                type="submit"
                disabled={!canSubmit}
              >
                {status === "running" ? (
                  <>
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    {strings.common.processing}
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    {strings.taskrouter.addParticularFilter.submit}
                  </>
                )}
              </ActionButton>

              {status === "running" && (
                <ActionButton action="stop" type="button" onClick={handleAbort}>
                  {strings.common.cancel}
                </ActionButton>
              )}

              {(logs.length > 0 || status !== "idle") &&
                status !== "running" && (
                  <ActionButton action="clear" type="button" onClick={reset}>
                    {strings.common.clear}
                  </ActionButton>
                )}
            </ActionBar>
          </InputActions>
          {filterNameError && (
            <p id="filter-name-error" className="text-xs text-destructive">
              {filterNameError}
            </p>
          )}
        </div>

        {/* Workflow / Task Queue pairs */}
        <div className="space-y-2">
          {/* Column headers */}
          <InputActions>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="hidden gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem]">
                <p className="text-sm font-medium">
                  {strings.taskrouter.addParticularFilter.workflowSidColLabel}
                </p>
                <p className="text-sm font-medium">
                  {strings.taskrouter.addParticularFilter.taskQueueSidColLabel}
                </p>
                <div />
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem]">
                      <div className="col-start-1 space-y-1 sm:col-auto">
                        <Label
                          htmlFor={`filter-workflow-${i}`}
                          className="sm:sr-only"
                        >
                          {
                            strings.taskrouter.addParticularFilter
                              .workflowSidColLabel
                          }
                        </Label>
                        <Input
                          id={`filter-workflow-${i}`}
                          aria-describedby={
                            rowErrors[i]?.workflowSid
                              ? `filter-workflow-error-${i}`
                              : undefined
                          }
                          aria-invalid={!!rowErrors[i]?.workflowSid}
                          aria-label={
                            strings.taskrouter.addParticularFilter
                              .workflowSidColLabel
                          }
                          value={row.workflowSid}
                          onChange={(e) =>
                            updateRow(i, "workflowSid", e.target.value)
                          }
                          placeholder={strings.common.placeholders.workflowSid}
                          disabled={status === "running"}
                          className={cn(
                            "font-mono text-xs",
                            rowErrors[i]?.workflowSid && "border-destructive"
                          )}
                        />
                        {rowErrors[i]?.workflowSid && (
                          <p
                            id={`filter-workflow-error-${i}`}
                            className="text-xs text-destructive"
                          >
                            {rowErrors[i].workflowSid}
                          </p>
                        )}
                      </div>
                      <div className="col-start-1 space-y-1 sm:col-auto">
                        <Label
                          htmlFor={`filter-queue-${i}`}
                          className="sm:sr-only"
                        >
                          {
                            strings.taskrouter.addParticularFilter
                              .taskQueueSidColLabel
                          }
                        </Label>
                        <Input
                          id={`filter-queue-${i}`}
                          aria-describedby={
                            rowErrors[i]?.taskQueueSid
                              ? `filter-queue-error-${i}`
                              : undefined
                          }
                          aria-invalid={!!rowErrors[i]?.taskQueueSid}
                          aria-label={
                            strings.taskrouter.addParticularFilter
                              .taskQueueSidColLabel
                          }
                          value={row.taskQueueSid}
                          onChange={(e) =>
                            updateRow(i, "taskQueueSid", e.target.value)
                          }
                          placeholder={strings.common.placeholders.taskQueueSid}
                          disabled={status === "running"}
                          className={cn(
                            "font-mono text-xs",
                            rowErrors[i]?.taskQueueSid && "border-destructive"
                          )}
                        />
                        {rowErrors[i]?.taskQueueSid && (
                          <p
                            id={`filter-queue-error-${i}`}
                            className="text-xs text-destructive"
                          >
                            {rowErrors[i].taskQueueSid}
                          </p>
                        )}
                      </div>
                      <ActionButton
                        action="remove"
                        iconOnly
                        type="button"
                        disabled={status === "running" || rows.length === 1}
                        onClick={() => removeRow(i)}
                        className="col-start-2 row-start-1 mt-6 sm:col-auto sm:row-auto sm:mt-0"
                        aria-label={strings.common.remove}
                      ></ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ActionBar className="sm:pt-7">
              <ActionButton
                action="add"
                type="button"
                disabled={status === "running" || rows.length >= MAX_ITEMS}
                onClick={addRow}
              >
                {strings.taskrouter.addParticularFilter.addEntry}
              </ActionButton>
            </ActionBar>
          </InputActions>
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
          <span className="font-medium text-success dark:text-success">
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
              <span className="font-medium text-destructive">
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
          <p className="text-xs font-medium tracking-normal text-muted-foreground">
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
