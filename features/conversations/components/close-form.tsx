"use client"

import {
  AlertTriangle,
  ChevronRight,
  MessageSquareOff,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { ContactInput } from "@/components/contact-input"
import { WarningBadge } from "@/components/warning-badge"
import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
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
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
import { strings } from "@/lib/strings"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  totalClosed: number
  totalErrors: number
}

interface HistoryEntry {
  ts: number
  total: number
  closed: number
  errors: number
}

interface Progress {
  current: number
  total: number
}

const HISTORY_KEY = "switchboard:close-history"
const PHONE_RE = /^\d+$/

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

export function CloseForm() {
  const { activeEnvironment } = useEnvironment()
  const [phones, setPhones] = React.useState<string[]>([""])
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [fieldErrors, setFieldErrors] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const participants = phones.map((p) => p.trim()).filter(Boolean)
  const canSubmit =
    participants.length > 0 &&
    participants.length <= MAX_ITEMS &&
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
    setFieldErrors([])
  }

  function clearAll() {
    reset()
    setPhones([""])
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
      const res = await fetch("/api/conversations/close", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
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
              totalClosed?: number
              totalErrors?: number
              progress?: Progress
            }

            if (payload.progress) setProgress(payload.progress)
            addLog(payload.level, payload.message)

            if (payload.done) {
              const closed = payload.totalClosed ?? 0
              const errors = payload.totalErrors ?? 0
              setSummary({ totalClosed: closed, totalErrors: errors })
              setStatus("done")
              const entry: HistoryEntry = {
                ts: Date.now(),
                total: participants.length,
                closed,
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
      const message =
        err instanceof Error ? err.message : strings.common.unexpectedError
      addLog("error", message)
      setStatus("error")
    } finally {
      abortRef.current = null
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const errs: string[] = []
    for (const phone of participants) {
      if (!PHONE_RE.test(phone)) {
        errs.push(phone)
      }
    }
    if (errs.length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors([])
    setConfirmOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/conversations"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.conversations}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {strings.conversations.close.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquareOff className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.conversations.close.title}
            </h1>
            <WarningBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            {strings.conversations.close.subtitle}
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
        <div className="space-y-2">
          <Label>
            {strings.conversations.close.phoneLabel}{" "}
            <span className="font-normal text-muted-foreground">
              {strings.conversations.close.phoneLabelHint}
            </span>
          </Label>
          <div className="space-y-2">
            {phones.map((phone, i) => (
              <div key={i} className="flex items-center gap-2">
                <ContactInput
                  value={phone}
                  onChange={(v) => {
                    setPhones((prev) => prev.map((p, j) => (j === i ? v : p)))
                    if (fieldErrors.includes(v.trim())) {
                      setFieldErrors((prev) =>
                        prev.filter((e) => e !== v.trim())
                      )
                    }
                  }}
                  placeholder="11987654321"
                  disabled={status === "running"}
                  prefix="whatsapp:+55"
                  containerClassName="flex-1"
                  className="pl-[7.5rem]"
                />
                <button
                  type="button"
                  disabled={status === "running" || phones.length === 1}
                  onClick={() =>
                    setPhones((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                  aria-label={strings.conversations.close.removePhone}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={status === "running" || phones.length >= MAX_ITEMS}
            onClick={() => setPhones((prev) => [...prev, ""])}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            {strings.conversations.close.addPhone}
          </button>
          {fieldErrors.length > 0 && (
            <p className="text-xs text-destructive">
              {strings.common.phoneDigitsOnly}: {fieldErrors.join(", ")}
            </p>
          )}
          {participants.length > MAX_ITEMS && (
            <p className="text-xs text-destructive">
              {strings.conversations.close.maxExceeded(MAX_ITEMS)}
            </p>
          )}
        </div>

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
                {strings.conversations.close.submit}
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
              onClick={clearAll}
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
              {strings.conversations.close.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.conversations.close.confirmDescription(
                participants.length
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40"
              onClick={() => {
                setConfirmOpen(false)
                void runSubmit()
              }}
            >
              {strings.conversations.close.confirmAction}
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
          <span className="font-medium">
            {strings.conversations.close.summary.prefix}
          </span>{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {strings.conversations.close.summary.closed(summary.totalClosed)}
          </span>
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="font-medium text-red-600 dark:text-red-400">
                {strings.conversations.close.summary.errors(
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
              <span className="font-semibold text-foreground">
                {strings.conversations.close.history.item(h.total, h.closed)}
              </span>
              {h.errors > 0 && (
                <span className="text-red-500 dark:text-red-400">
                  {strings.conversations.close.history.itemErrors(h.errors)}
                </span>
              )}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
