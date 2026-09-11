"use client"

import {
  AlertTriangle,
  ChevronRight,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  UserPlus,
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
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
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

export function AssignWorkersForm() {
  const management = useWorkerManagement()
  const { activeEnvironment } = useEnvironment()
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
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

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

    const rawLevel = levelInput.trim() !== "" ? Number(levelInput.trim()) : null
    const level = rawLevel !== null ? Math.min(5, Math.max(0, rawLevel)) : null

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/taskrouter/assign-workers", {
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
              totalUpdated?: number
              totalSkipped?: number
              totalErrors?: number
              progress?: Progress
            }

            if (payload.progress) setProgress(payload.progress)
            addLog(payload.level, payload.message)

            if (payload.done) {
              const updated = payload.totalUpdated ?? 0
              const skipped = payload.totalSkipped ?? 0
              const errors = payload.totalErrors ?? 0
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
              pushHistory(entry)
              setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
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
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav
        data-worker-page-header
        className="mb-5 flex items-center gap-1 text-sm"
      >
        <Link
          href="/taskrouter"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.taskrouter}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {strings.taskrouter.assignWorkers.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div data-worker-page-header className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <UserPlus className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.taskrouter.assignWorkers.title}
            </h1>
            <WarningBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.assignWorkers.subtitle}
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
        <div data-worker-workspace-field className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.assignWorkers.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
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
            <p className="text-xs text-destructive">
              {fieldErrors.workspaceSid}
            </p>
          )}
        </div>

        <fieldset className="space-y-2" disabled={status === "running"}>
          <legend className="mb-2 text-sm font-medium">
            {strings.taskrouter.assignWorkers.workersLabel}
          </legend>
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
                placeholder={strings.taskrouter.assignWorkers.workerPlaceholder}
                className="flex-1"
              />
              <button
                type="button"
                disabled={workers.length === 1}
                onClick={() =>
                  setWorkers((previous) =>
                    previous.filter((_, position) => position !== index)
                  )
                }
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                aria-label={strings.taskrouter.assignWorkers.removeWorker(
                  index + 1
                )}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={workers.length >= MAX_ITEMS}
            onClick={() => setWorkers((previous) => [...previous, ""])}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {strings.taskrouter.assignWorkers.addWorker}
          </button>
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
                {strings.taskrouter.assignWorkers.submit}
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
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
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
              <span className="font-medium text-red-600 dark:text-red-400">
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
                <span className="text-red-500 dark:text-red-400">
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
