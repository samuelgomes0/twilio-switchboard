"use client"
import { useOperationReview } from "@/components/use-operation-review"
import {
  OperationReviewPanel,
  OperationResults,
  OperationRecovery,
} from "@/components/operation-review"
import { isTargetResult, type TargetResult } from "@/lib/operation-review"
import {
  useOperationDraft,
  useUnsavedChanges,
} from "@/components/use-operation-draft"
import { OperationForm } from "@/components/operation-form"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { Loader2, MessageSquareOff } from "lucide-react"
import * as React from "react"

import { ContactInput } from "@/components/contact-input"
import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
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
import { normalizeClosePhone } from "@/features/conversations/lib/normalize-close-phone"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY, MAX_ITEMS } from "@/lib/constants"
import {
  clearHistory as clearStoredHistory,
  environmentHistoryKey,
  pushHistory,
  readHistory,
} from "@/lib/operation-history"
import { consumeSseStream } from "@/lib/sse-reader"
import { strings } from "@/lib/strings"

type Status = "idle" | "running" | "done" | "error" | "cancelled"

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
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
  const [phones, setPhones] = useOperationDraft<string[]>(
    [""],
    `${activeEnvironment?.id}:close:phones`
  )
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )
  const [fieldErrors, setFieldErrors] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState<Progress | null>(null)
  useUnsavedChanges(
    status === "running" || phones.some((phone) => phone.trim())
  )
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const participants = phones.map((p) => p.trim()).filter(Boolean)
  const targetPreview = useOperationReview(
    "/api/conversations/close-by-number",
    "CH",
    { participants }
  )
  const [results, setResults] = React.useState<TargetResult[]>([])
  const busy = status === "running" || targetPreview.loading
  const canSubmit =
    participants.length > 0 &&
    participants.length <= MAX_ITEMS &&
    !busy &&
    !!activeEnvironment

  function addLog(level: LogEntry["level"], message: string) {
    setLogs((prev) => [...prev, createLogEntry(level, message)])
  }

  function reset() {
    setResults([])
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
    if (historyKey) clearStoredHistory(historyKey)
    setHistory([])
  }

  function handleAbort() {
    abortRef.current?.abort()
    targetPreview.cancel()
  }

  async function runSubmit() {
    if (!canSubmit || !activeEnvironment || abortRef.current) return
    const review = targetPreview.currentReview()
    if (!review) return
    targetPreview.invalidate()
    reset()
    setResults(
      review.targets.map((target) => ({ id: target.id, status: "pending" }))
    )
    setStatus("running")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/conversations/close-by-number", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
          review,
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
        if (isTargetResult(payload.result)) {
          const result = payload.result
          setResults((previous) =>
            previous.map((item) => (item.id === result.id ? result : item))
          )
        }
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
          const closed =
            typeof payload.totalClosed === "number" ? payload.totalClosed : 0
          const errors =
            typeof payload.totalErrors === "number" ? payload.totalErrors : 0
          setSummary({ totalClosed: closed, totalErrors: errors })
          setStatus("done")
          const entry: HistoryEntry = {
            ts: Date.now(),
            total: participants.length,
            closed,
            errors,
          }
          pushHistory(historyKey, entry)
          setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
        }
      })
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        addLog("warning", strings.common.aborted)
        setStatus("cancelled")
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

    const errs: string[] = []
    for (const phone of participants) {
      if (normalizeClosePhone(phone) === null) {
        errs.push(phone)
      }
    }
    if (errs.length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors([])
    if (targetPreview.currentReview()) setConfirmOpen(true)
  }

  return (
    <div className="workspace-page">
      <PageHeader
        title={strings.conversations.close.title}
        description={strings.conversations.close.subtitle}
        badge={<WarningBadge />}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      <OperationForm
        onSubmit={handleFormSubmit}
        bodyClassName="space-y-6"
        actions={
          <>
            <ActionButton
              action="search"
              type="button"
              disabled={!canSubmit}
              aria-busy={targetPreview.loading}
              onClick={() => void targetPreview.analyze()}
            >
              {targetPreview.loading
                ? strings.operationReview.loading
                : strings.operationReview.analyze}
            </ActionButton>
            <ActionButton
              action="destructive"
              aria-busy={status === "running"}
              type="submit"
              disabled={!canSubmit || !targetPreview.review?.targets.length}
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
                  <MessageSquareOff aria-hidden="true" className="size-3.5" />
                  {strings.conversations.close.submit}
                </>
              )}
            </ActionButton>

            {busy && (
              <ActionButton action="stop" type="button" onClick={handleAbort}>
                {strings.common.cancel}
              </ActionButton>
            )}

            {(logs.length > 0 || status !== "idle") && status !== "running" && (
              <ActionButton action="clear" type="button" onClick={clearAll}>
                {strings.common.clear}
              </ActionButton>
            )}
          </>
        }
      >
        <div className="space-y-2">
          <Label id="close-phones-label" htmlFor="close-phone-0">
            {strings.conversations.close.phoneLabel}
          </Label>
          <p id="close-phones-hint" className="text-sm text-muted-foreground">
            {strings.conversations.close.phoneLabelHint}
          </p>

          <div className="min-w-0 space-y-3">
            <div className="space-y-2">
              {phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ContactInput
                    id={`close-phone-${i}`}
                    aria-labelledby="close-phones-label"
                    aria-describedby={
                      fieldErrors.length > 0
                        ? "close-phones-hint close-phones-error"
                        : "close-phones-hint"
                    }
                    aria-invalid={fieldErrors.includes(phone.trim())}
                    value={phone}
                    onChange={(v) => {
                      setPhones((prev) => prev.map((p, j) => (j === i ? v : p)))
                      if (fieldErrors.includes(v.trim())) {
                        setFieldErrors((prev) =>
                          prev.filter((e) => e !== v.trim())
                        )
                      }
                    }}
                    placeholder={strings.common.placeholders.localPhone}
                    disabled={busy}
                    prefix="whatsapp:+55"
                    containerClassName="min-w-0 flex-1"
                    className="pl-[7.5rem]"
                  />
                  {phones.length > 1 && (
                    <ActionButton
                      action="remove"
                      iconOnly
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setPhones((prev) => prev.filter((_, j) => j !== i))
                      }
                      aria-label={strings.conversations.close.removePhone}
                    />
                  )}
                </div>
              ))}
            </div>
            <ActionButton
              action="add"
              type="button"
              disabled={busy || phones.length >= MAX_ITEMS}
              onClick={() => setPhones((prev) => [...prev, ""])}
            >
              {strings.conversations.close.addPhone}
            </ActionButton>
            {fieldErrors.length > 0 && (
              <p id="close-phones-error" className="text-xs text-destructive">
                {strings.conversations.close.invalidPhone}:{" "}
                {fieldErrors.join(", ")}
              </p>
            )}
            {participants.length > MAX_ITEMS && (
              <p className="text-xs text-destructive">
                {strings.conversations.close.maxExceeded(MAX_ITEMS)}
              </p>
            )}
          </div>
        </div>
      </OperationForm>

      {targetPreview.error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {targetPreview.error}
        </p>
      )}
      {targetPreview.review && (
        <OperationReviewPanel review={targetPreview.review} />
      )}
      <OperationResults results={results} />
      <OperationRecovery
        status={
          status === "done" &&
          results.some((result) => result.status !== "success")
            ? "error"
            : status
        }
      />
      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.conversations.close.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.conversations.close.confirmDescription(
                participants.length,
                activeEnvironment?.name ?? ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              {strings.conversations.close.confirmTargets}
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-muted p-3 font-mono text-xs">
              {participants.map((phone, index) => (
                <li key={index} className="break-all">
                  {normalizeClosePhone(phone)}
                </li>
              ))}
            </ul>
          </div>
          {targetPreview.review?.partial && (
            <p role="status" className="text-sm text-warning">
              {strings.operationReview.partial}
            </p>
          )}
          <p className="text-sm">
            {strings.operationReview.title}:{" "}
            {targetPreview.review?.targets.length ?? 0}
          </p>
          <ul className="max-h-40 overflow-auto font-mono text-xs">
            {targetPreview.review?.targets.map((target) => (
              <li key={target.id}>
                {target.id}
                {target.relatedId ? ` · ${target.relatedId}` : ""}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canSubmit || !targetPreview.review?.targets.length}
              className={buttonVariants({ variant: "destructive" })}
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
          <span className="font-medium">
            {strings.conversations.close.summary.prefix}
          </span>{" "}
          <span className="font-medium text-success dark:text-success">
            {strings.conversations.close.summary.closed(summary.totalClosed)}
          </span>
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="font-medium text-destructive">
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
                {strings.conversations.close.history.item(h.total, h.closed)}
              </span>
              {h.errors > 0 && (
                <span className="text-destructive">
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
