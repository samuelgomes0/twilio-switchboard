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
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
import { environmentHistoryKey, pushHistory, readHistory } from "@/lib/operation-history"
import { consumeSseStream } from "@/lib/sse-reader"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { useWorkerManagement } from "./worker-management-context"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  totalUpdated: number
  totalSkipped: number
  totalErrors: number
}

interface HistoryEntry {
  ts: number
  workspaceSid: string
  skill: string
  updated: number
  skipped: number
  errors: number
}

interface Progress {
  current: number
  total: number
}

const HISTORY_KEY = "switchboard:assign-workers-history"
const WS_SIDS_KEY = STORED_KEYS.workspaceSids
const SKILLS_KEY = STORED_KEYS.skillNames
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AssignWorkersForm() {
  const management = useWorkerManagement()
  const { activeEnvironment } = useEnvironment()
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
  const [localWorkspaceSid, setLocalWorkspaceSid] = React.useState("")
  const workspaceSid = management?.workspaceSid ?? localWorkspaceSid
  const setWorkspaceSid = management?.setWorkspaceSid ?? setLocalWorkspaceSid
  const [skill, setSkill] = React.useState("")
  const [levelInput, setLevelInput] = React.useState("")
  const [workers, setWorkers] = React.useState<string[]>([
    management?.selectedWorkerSid ?? "",
  ])
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const emails = [
    ...new Set(workers.map((identifier) => identifier.trim()).filter(Boolean)),
  ]
  const canSubmit =
    workspaceSid.trim().length > 0 &&
    skill.trim().length > 0 &&
    emails.length > 0 &&
    emails.length <= MAX_ITEMS &&
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
      if (historyKey) localStorage.removeItem(historyKey)
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

    const rawLevel = levelInput.trim() !== "" ? Number(levelInput.trim()) : null
    const level = rawLevel !== null ? Math.min(5, Math.max(0, rawLevel)) : null

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/taskrouter/add-skill-to-workers", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSid: workspaceSid.trim(),
          skill: skill.trim(),
          level,
          emails,
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
          if (
            typeof payload.progress === "object" &&
            payload.progress !== null &&
            "current" in payload.progress &&
            "total" in payload.progress &&
            typeof payload.progress.current === "number" &&
            typeof payload.progress.total === "number"
          ) {
            setProgress(payload.progress as Progress)
          }
          addLog(payload.level, payload.message)

          if (payload.done === true) {
            if (payload.level === "error") {
              setStatus("error")
              return
            }
            const updated = typeof payload.totalUpdated === "number" ? payload.totalUpdated : 0
            const skipped = typeof payload.totalSkipped === "number" ? payload.totalSkipped : 0
            const errors = typeof payload.totalErrors === "number" ? payload.totalErrors : 0
            setSummary({
              totalUpdated: updated,
              totalSkipped: skipped,
              totalErrors: errors,
            })
            setStatus("done")
            const entry: HistoryEntry = {
              ts: Date.now(),
              workspaceSid: workspaceSid.trim(),
              skill: skill.trim(),
              updated,
              skipped,
              errors,
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
      {!management && (
        <PageHeader
          title={strings.taskrouter.assignWorkers.title}
          description={strings.taskrouter.assignWorkers.subtitle}
          parent={{
            href: "/taskrouter",
            label: strings.sidebar.sections.taskrouter,
          }}
          badge={<WarningBadge />}
          embedded
        />
      )}

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      <form onSubmit={handleFormSubmit} className="operation-form space-y-5">
        {/* Workspace SID */}
        {!management && (
          <div data-worker-workspace-field className="space-y-2">
            <Label htmlFor="skill-workspace">
              {strings.taskrouter.assignWorkers.workspaceSidLabel}
            </Label>
            <StoredInput
              id="skill-workspace"
              aria-describedby={
                fieldErrors.workspaceSid ? "skill-workspace-error" : undefined
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
              <p
                id="skill-workspace-error"
                className="text-xs text-destructive"
              >
                {fieldErrors.workspaceSid}
              </p>
            )}
          </div>
        )}

        <fieldset className="space-y-2" disabled={status === "running"}>
          <legend className="mb-2 text-sm font-medium">
            {strings.taskrouter.assignWorkers.workersLabel}
          </legend>
          <InputActions>
            <div className="min-w-0 flex-1 space-y-2">
              {workers.map((worker, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Label htmlFor={`skill-worker-${index}`} className="sr-only">
                    {strings.taskrouter.assignWorkers.workerLabel(index + 1)}
                  </Label>
                  <Input
                    id={`skill-worker-${index}`}
                    value={worker}
                    onChange={(event) =>
                      setWorkers((previous) =>
                        previous.map((identifier, position) =>
                          position === index ? event.target.value : identifier
                        )
                      )
                    }
                    placeholder={
                      strings.taskrouter.assignWorkers.workerPlaceholder
                    }
                    className="min-w-0 flex-1"
                  />
                  <ActionButton
                    action="remove"
                    iconOnly
                    type="button"
                    disabled={workers.length === 1}
                    onClick={() =>
                      setWorkers((previous) =>
                        previous.filter((_, position) => position !== index)
                      )
                    }
                    aria-label={strings.taskrouter.assignWorkers.removeWorker(
                      index + 1
                    )}
                  ></ActionButton>
                </div>
              ))}
            </div>
            <ActionBar>
              <ActionButton
                action="add"
                type="button"
                disabled={workers.length >= MAX_ITEMS}
                onClick={() => setWorkers((previous) => [...previous, ""])}
              >
                {strings.taskrouter.assignWorkers.addWorker}
              </ActionButton>
            </ActionBar>
          </InputActions>
        </fieldset>

        {/* Skill name */}
        <div className="space-y-2">
          <Label htmlFor="skill">
            {strings.taskrouter.assignWorkers.skillLabel}
          </Label>
          <StoredInput
            id="skill"
            storageKey={SKILLS_KEY}
            environmentId={activeEnvironment?.id}
            value={skill}
            onChange={setSkill}
            placeholder={strings.common.placeholders.skill}
            disabled={status === "running"}
            className="font-sans text-sm placeholder:font-sans"
          />
        </div>

        {/* Level */}
        <div className="space-y-2">
          <Label htmlFor="level">
            {strings.taskrouter.assignWorkers.levelLabel}{" "}
            <span className="font-normal text-muted-foreground">
              {strings.taskrouter.assignWorkers.levelOptional}
            </span>
          </Label>
          <InputActions>
            <div className="min-w-0 flex-1">
              <Input
                id="level"
                type="number"
                placeholder={strings.common.placeholders.level}
                min={0}
                max={5}
                value={levelInput}
                onChange={(e) => setLevelInput(e.target.value)}
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
                    {strings.taskrouter.assignWorkers.submit}
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
              {strings.taskrouter.assignWorkers.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.taskrouter.assignWorkers.confirmDescription(
                skill.trim(),
                emails.length,
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
              {strings.taskrouter.assignWorkers.confirmAction}
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
            {strings.taskrouter.assignWorkers.summary.updated(
              summary.totalUpdated
            )}
          </span>{" "}
          &middot;{" "}
          <span className="text-muted-foreground">
            {strings.taskrouter.assignWorkers.summary.skipped(
              summary.totalSkipped
            )}
          </span>
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="font-medium text-destructive">
                {strings.taskrouter.assignWorkers.summary.errors(
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
              <span className="font-mono font-semibold break-all text-foreground select-text">
                {h.workspaceSid}
              </span>
              {" — "}
              <span>{h.skill}</span>
              {" — "}
              {strings.taskrouter.assignWorkers.history.item(h.updated)}
              {h.skipped > 0 && (
                <span>
                  {strings.taskrouter.assignWorkers.history.itemSkipped(
                    h.skipped
                  )}
                </span>
              )}
              {h.errors > 0 && (
                <span className="text-destructive">
                  {strings.taskrouter.assignWorkers.history.itemErrors(
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
