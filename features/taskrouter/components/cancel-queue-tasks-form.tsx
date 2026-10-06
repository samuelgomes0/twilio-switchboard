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
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { StoredInput } from "@/components/stored-input"
import { StoredTextarea } from "@/components/stored-textarea"
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
import { buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { WarningBadge } from "@/components/warning-badge"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY } from "@/lib/constants"
import { pushHistory, readHistory } from "@/lib/operation-history"
import { consumeSseStream } from "@/lib/sse-reader"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  totalSuccess: number
  totalSkipped: number
  totalErrors: number
}

interface HistoryEntry {
  ts: number
  workspaceSid: string
  taskQueueName: string
  success: number
  skipped: number
  errors: number
}

interface Progress {
  current: number
  total: number
}

const HISTORY_KEY = "switchboard:cancel-queue-tasks-history"
const WS_SIDS_KEY = STORED_KEYS.workspaceSids
const QUEUE_NAMES_KEY = STORED_KEYS.queueNames
const CLOSE_MESSAGES_KEY = STORED_KEYS.closeMessages
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CancelQueueTasksForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [taskQueueName, setTaskQueueName] = React.useState("")
  const [closeMessage, setCloseMessage] = React.useState<string>(
    strings.taskrouter.cancelQueueTasks.defaultCloseMessage
  )
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => readHistory<HistoryEntry>(HISTORY_KEY),
    []
  )
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    taskQueueName.trim().length > 0 &&
    closeMessage.trim().length > 0 &&
    status !== "running" &&
    !!activeEnvironment

  function addLog(level: LogEntry["level"], message: string) {
    setLogs((prev) => [...prev, createLogEntry(level, message)])
  }

  function reset() {
    setLogs([])
    setStatus("idle")
    setSummary(null)
    setProgress(null)
    setFieldErrors({})
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    setHistory([])
  }

  function handleAbort() {
    abortRef.current?.abort()
  }

  async function runSubmit() {
    if (!canSubmit || !activeEnvironment) return

    reset()
    setStatus("running")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(
        "/api/taskrouter/cancel-queue-tasks-and-close-conversations",
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSid: workspaceSid.trim(),
            taskQueueName: taskQueueName.trim(),
            closeMessage: closeMessage.trim(),
            accountSid: activeEnvironment.accountSid,
            authToken: activeEnvironment.authToken,
          }),
        }
      )

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
            totalSuccess?: number
            totalSkipped?: number
            totalErrors?: number
            progress?: Progress
          }

          if (payload.progress) setProgress(payload.progress)
          addLog(payload.level, payload.message)

          if (payload.done) {
            const success = payload.totalSuccess ?? 0
            const skipped = payload.totalSkipped ?? 0
            const errors = payload.totalErrors ?? 0
            setSummary({
              totalSuccess: success,
              totalSkipped: skipped,
              totalErrors: errors,
            })
            setStatus("done")
            const entry: HistoryEntry = {
              ts: Date.now(),
              workspaceSid: workspaceSid.trim(),
              taskQueueName: taskQueueName.trim(),
              success,
              skipped,
              errors,
            }
            pushHistory(HISTORY_KEY, entry)
            setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
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

    const errs: Record<string, string> = {}
    if (!WS_SID_RE.test(workspaceSid.trim())) {
      errs.workspaceSid = strings.common.workspaceSidInvalid
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setConfirmOpen(true)
  }

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.taskrouter.cancelQueueTasks.title}
        description={strings.taskrouter.cancelQueueTasks.subtitle}
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
            {strings.taskrouter.cancelQueueTasks.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            aria-describedby={
              fieldErrors.workspaceSid ? "cancel-workspace-error" : undefined
            }
            aria-invalid={!!fieldErrors.workspaceSid}
            storageKey={WS_SIDS_KEY}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(v) => {
              setWorkspaceSid(v)
              if (fieldErrors.workspaceSid)
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.workspaceSid
                  return next
                })
            }}
            placeholder={strings.common.placeholders.workspaceSid}
            disabled={status === "running"}
          />
          {fieldErrors.workspaceSid && (
            <p id="cancel-workspace-error" className="text-xs text-destructive">
              {fieldErrors.workspaceSid}
            </p>
          )}
        </div>

        {/* Task Queue Name */}
        <div className="space-y-2">
          <Label htmlFor="taskQueueName">
            {strings.taskrouter.cancelQueueTasks.taskQueueNameLabel}
          </Label>
          <StoredInput
            id="taskQueueName"
            storageKey={QUEUE_NAMES_KEY}
            environmentId={activeEnvironment?.id}
            value={taskQueueName}
            onChange={setTaskQueueName}
            placeholder={strings.common.placeholders.queue}
            disabled={status === "running"}
            className="font-mono"
          />
        </div>

        {/* Close message */}
        <div className="space-y-2">
          <Label htmlFor="closeMessage">
            {strings.taskrouter.cancelQueueTasks.closeMessageLabel}
          </Label>
          <InputActions>
            <div className="min-w-0 flex-1">
              <StoredTextarea
                id="closeMessage"
                storageKey={CLOSE_MESSAGES_KEY}
                value={closeMessage}
                onChange={setCloseMessage}
                rows={3}
                disabled={status === "running"}
              />
            </div>
            <ActionBar>
              <ActionButton
                action="destructive"
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
                    {strings.taskrouter.cancelQueueTasks.submit}
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
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.taskrouter.cancelQueueTasks.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.taskrouter.cancelQueueTasks.confirmDescription(
                taskQueueName.trim(),
                workspaceSid.trim()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                setConfirmOpen(false)
                void runSubmit()
              }}
            >
              {strings.taskrouter.cancelQueueTasks.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Progress bar */}
      {progress && status === "running" && (
        <div className="mt-5 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.current} / {progress.total}
            </span>
            <span>
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={strings.common.operationProgress}
            aria-valuemin={0}
            aria-valuenow={progress.current}
            aria-valuemax={progress.total}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(progress.current / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Summary banner */}
      {summary && status === "done" && (
        <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium text-success dark:text-success">
            {strings.taskrouter.cancelQueueTasks.summary.success(
              summary.totalSuccess
            )}
          </span>{" "}
          &middot;{" "}
          <span className="text-muted-foreground">
            {strings.taskrouter.cancelQueueTasks.summary.skipped(
              summary.totalSkipped
            )}
          </span>
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="font-medium text-destructive">
                {strings.taskrouter.cancelQueueTasks.summary.errors(
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
              <span className="font-mono font-semibold text-foreground">
                {h.taskQueueName}
              </span>
              {" — "}
              {strings.taskrouter.cancelQueueTasks.history.item(h.success)}
              {h.skipped > 0 && (
                <span>
                  {strings.taskrouter.cancelQueueTasks.history.itemSkipped(
                    h.skipped
                  )}
                </span>
              )}
              {h.errors > 0 && (
                <span className="text-destructive">
                  {strings.taskrouter.cancelQueueTasks.history.itemErrors(
                    h.errors
                  )}
                </span>
              )}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
