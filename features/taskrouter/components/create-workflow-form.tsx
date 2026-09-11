"use client"

import {
  AlertTriangle,
  ChevronRight,
  GitBranch,
  Play,
  RotateCcw,
  Square,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
import { WarningBadge } from "@/components/warning-badge"
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
import { Button } from "@/components/ui/button"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  workflowSid: string
  workflowName: string
  totalFilters: number
}

interface HistoryEntry {
  ts: number
  workspaceSid: string
  workflowName: string
  workflowSid: string
  totalFilters: number
}

const HISTORY_KEY = "switchboard:create-workflow-history"
const WS_SIDS_KEY = STORED_KEYS.workspaceSids
const WF_NAMES_KEY = STORED_KEYS.workflowNames
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i

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

export function CreateWorkflowForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [workflowName, setWorkflowName] = React.useState("")
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [wsSidError, setWsSidError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    workflowName.trim().length > 0 &&
    csvFile !== null &&
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

  async function runSubmit() {
    if (!canSubmit || !activeEnvironment || !csvFile) return

    reset()
    setStatus("running")

    let csvContent: string
    try {
      csvContent = await csvFile.text()
    } catch {
      addLog("error", strings.taskrouter.createWorkflow.csvReadError)
      setStatus("error")
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/taskrouter/create-workflow", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSid: workspaceSid.trim(),
          workflowName: workflowName.trim(),
          csvContent,
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
              workflowSid?: string
              workflowName?: string
              totalFilters?: number
            }

            addLog(payload.level, payload.message)

            if (payload.done) {
              if (payload.workflowSid) {
                const wfSid = payload.workflowSid
                const wfName = payload.workflowName ?? workflowName.trim()
                const totalFilters = payload.totalFilters ?? 0
                setSummary({
                  workflowSid: wfSid,
                  workflowName: wfName,
                  totalFilters,
                })
                setStatus("done")
                const entry: HistoryEntry = {
                  ts: Date.now(),
                  workspaceSid: workspaceSid.trim(),
                  workflowName: wfName,
                  workflowSid: wfSid,
                  totalFilters,
                }
                pushHistory(entry)
                setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
              } else {
                setStatus("error")
              }
            }
          } catch {
            // Invalid events are ignored because the stream can contain partial data.
          }
        }
      }

      setStatus((prev) => (prev !== "done" ? "done" : prev))
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

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (!WS_SID_RE.test(workspaceSid.trim())) {
      setWsSidError(strings.common.workspaceSidInvalid)
      return
    }
    setWsSidError(null)
    setConfirmOpen(true)
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
          {strings.taskrouter.createWorkflow.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <GitBranch className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.taskrouter.createWorkflow.title}
            </h1>
            <WarningBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.createWorkflow.subtitle}
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
            {strings.taskrouter.createWorkflow.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            storageKey={WS_SIDS_KEY}
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
            <p className="text-xs text-destructive">{wsSidError}</p>
          )}
        </div>

        {/* Workflow name */}
        <div className="space-y-2">
          <Label htmlFor="workflowName">
            {strings.taskrouter.createWorkflow.workflowNameLabel}
          </Label>
          <StoredInput
            id="workflowName"
            storageKey={WF_NAMES_KEY}
            environmentId={activeEnvironment?.id}
            value={workflowName}
            onChange={setWorkflowName}
            placeholder={strings.common.placeholders.workflow}
            disabled={status === "running"}
            className="font-sans text-sm placeholder:font-sans"
          />
        </div>

        {/* CSV file */}
        <div className="space-y-2">
          <Label htmlFor="csvFile">
            {strings.taskrouter.createWorkflow.csvLabel}
          </Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            disabled={status === "running"}
            className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
          />
          {csvFile && (
            <p className="text-xs text-muted-foreground">
              {strings.taskrouter.createWorkflow.csvSelected(csvFile.name)}
            </p>
          )}
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
                {strings.taskrouter.createWorkflow.submit}
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
              {strings.taskrouter.createWorkflow.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.taskrouter.createWorkflow.confirmDescription(
                workflowName.trim(),
                workspaceSid.trim(),
                csvFile?.name ?? ""
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
              {strings.taskrouter.createWorkflow.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Summary banner */}
      {summary && status === "done" && (
        <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {strings.taskrouter.createWorkflow.summary.created(
              summary.workflowName
            )}
          </span>{" "}
          &middot;{" "}
          <span className="font-mono text-muted-foreground">
            {summary.workflowSid}
          </span>{" "}
          &middot;{" "}
          <span className="text-muted-foreground">
            {strings.taskrouter.createWorkflow.summary.filters(
              summary.totalFilters
            )}
          </span>
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
              <span className="font-semibold text-foreground">
                {h.workflowName}
              </span>
              {" — "}
              <span className="font-mono break-all select-text">
                {h.workflowSid}
              </span>
              {" — "}
              {strings.taskrouter.createWorkflow.history.itemFilters(
                h.totalFilters
              )}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
