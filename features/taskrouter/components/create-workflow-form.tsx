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
import { MAX_HISTORY } from "@/lib/constants"
import { pushHistory, readHistory } from "@/lib/operation-history"
import { consumeSseStream } from "@/lib/sse-reader"
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
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => readHistory<HistoryEntry>(HISTORY_KEY),
    []
  )
  const [wsSidError, setWsSidError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

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
      await consumeSseStream(reader, (dataLine) => {
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
              pushHistory(HISTORY_KEY, entry)
              setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
            } else {
              setStatus("error")
            }
          }
        } catch {
          // Invalid events are ignored because the stream can contain partial data.
        }
      })

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
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.taskrouter.createWorkflow.title}
        description={strings.taskrouter.createWorkflow.subtitle}
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
            {strings.taskrouter.createWorkflow.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            aria-describedby={wsSidError ? "create-workspace-error" : undefined}
            aria-invalid={!!wsSidError}
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
            <p id="create-workspace-error" className="text-xs text-destructive">
              {wsSidError}
            </p>
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
          <InputActions>
            <div className="min-w-0 flex-1">
              <Input
                id="csvFile"
                aria-describedby={csvFile ? "workflow-csv-selected" : undefined}
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                disabled={status === "running"}
                className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
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
                    {strings.taskrouter.createWorkflow.submit}
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
          {csvFile && (
            <p
              id="workflow-csv-selected"
              className="text-xs text-muted-foreground"
            >
              {strings.taskrouter.createWorkflow.csvSelected(csvFile.name)}
            </p>
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
          <span className="font-medium text-success dark:text-success">
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
