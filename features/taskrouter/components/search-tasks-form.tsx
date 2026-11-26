"use client"

import { useWorkspaceSid } from "./workspace-context"
import { WorkspaceInput } from "./workspace-input"
import { useBrowserState } from "@/components/use-browser-state"
import { TaskCard } from "./task-result-card"

import { PageHeader } from "@/components/page-header"

import { OperationForm } from "@/components/operation-form"

import { ActionButton } from "@/components/action-button"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { inferChannel } from "@/features/taskrouter/lib/infer-channel"

import { Loader2, Search } from "lucide-react"
import * as React from "react"

import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { SearchInput } from "@/components/search-input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type { SearchTaskResult, TaskData } from "@/features/taskrouter/types"
import { MAX_HISTORY } from "@/lib/constants"
import {
  clearHistory as clearStoredHistory,
  environmentHistoryKey,
  pushHistory,
  readHistory,
} from "@/lib/operation-history"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchMode = "sid" | "phone"

interface SidHistoryEntry {
  ts: number
  mode: "sid"
  workspaceSid?: string
  taskSid: string
  assignmentStatus: string
  taskQueueFriendlyName: string | null
}

interface PhoneHistoryEntry {
  ts: number
  mode: "phone"
  workspaceSid?: string
  phone: string
  count: number
}

type HistoryEntry = SidHistoryEntry | PhoneHistoryEntry

// ─── Constants ───────────────────────────────────────────────────────────────

const HISTORY_KEY = "switchboard:search-tasks-history"
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i
const TASK_SID_RE = /^WT[a-fA-F0-9]{32}$/i

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Channel inference ───────────────────────────────────────────────────────

function taskDataToResult(task: TaskData): SearchTaskResult {
  return {
    ...task,
    channel: inferChannel(task.attributes, task.taskChannelUniqueName),
  }
}

// ─── Badge variants ──────────────────────────────────────────────────────────

// ─── Sub-components ──────────────────────────────────────────────────────────

// ─── Main form ───────────────────────────────────────────────────────────────

export function SearchTasksForm({
  initialPhone = "",
  initialEnvironmentId,
}: {
  initialPhone?: string
  initialEnvironmentId?: string
}) {
  const { activeEnvironment } = useEnvironment()
  const contextMismatch =
    !!initialEnvironmentId && initialEnvironmentId !== activeEnvironment?.id
  const phoneFromLink =
    !contextMismatch && /^(?:whatsapp:)?\+?\d{10,15}$/.test(initialPhone)
      ? initialPhone
      : ""
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
  const [mode, setMode] = React.useState<SearchMode>(
    phoneFromLink ? "phone" : "sid"
  )
  const [workspaceSid, setWorkspaceSid] = useWorkspaceSid()
  const [taskSid, setTaskSid] = React.useState("")
  const [phone, setPhone] = React.useState(phoneFromLink)
  const [hasMore, setHasMore] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [tasks, setTasks] = React.useState<SearchTaskResult[] | null>(null)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  function handleModeChange(newMode: SearchMode) {
    if (newMode === mode) return
    setMode(newMode)
    setTaskSid("")
    setPhone("")
    setTasks(null)
    setHasMore(false)
    setError(null)
    setFieldErrors({})
  }

  const secondaryFilled =
    mode === "sid" ? taskSid.trim().length > 0 : phone.trim().length > 0

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    secondaryFilled &&
    !loading &&
    !!activeEnvironment

  async function runSearch(
    requestedMode = mode,
    requestedValue = mode === "sid" ? taskSid.trim() : phone.trim(),
    requestedWorkspaceSid = workspaceSid.trim()
  ) {
    if (
      !activeEnvironment ||
      loading ||
      abortRef.current ||
      !requestedWorkspaceSid ||
      !requestedValue
    )
      return
    setLoading(true)
    setError(null)
    setTasks(null)
    setHasMore(false)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (requestedMode === "sid") {
        const res = await fetch("/api/taskrouter/get-task-by-sid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSid: requestedWorkspaceSid,
            taskSid: requestedValue,
            accountSid: activeEnvironment.accountSid,
            authToken: activeEnvironment.authToken,
          }),
          signal: controller.signal,
        })
        const json = (await res.json()) as { task: TaskData; error?: string }
        if (controller.signal.aborted) return
        if (!res.ok || json.error) {
          setError(json.error ?? strings.common.unknown)
          return
        }
        const result = taskDataToResult(json.task)
        setTasks([result])
        const entry: SidHistoryEntry = {
          ts: Date.now(),
          mode: "sid",
          workspaceSid: requestedWorkspaceSid,
          taskSid: result.sid,
          assignmentStatus: result.assignmentStatus,
          taskQueueFriendlyName: result.taskQueueFriendlyName,
        }
        pushHistory(historyKey, entry)
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      } else {
        const res = await fetch("/api/taskrouter/search-tasks-by-number", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSid: requestedWorkspaceSid,
            phoneNumber: requestedValue,
            accountSid: activeEnvironment.accountSid,
            authToken: activeEnvironment.authToken,
          }),
          signal: controller.signal,
        })
        const json = (await res.json()) as {
          tasks: SearchTaskResult[]
          phone: string
          hasMore?: boolean
          error?: string
        }
        if (controller.signal.aborted) return
        if (!res.ok || json.error) {
          setError(json.error ?? strings.common.unknown)
          return
        }
        setTasks(json.tasks)
        setHasMore(json.hasMore === true)
        const entry: PhoneHistoryEntry = {
          ts: Date.now(),
          mode: "phone",
          workspaceSid: requestedWorkspaceSid,
          phone: json.phone,
          count: json.tasks.length,
        }
        pushHistory(historyKey, entry)
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      }
    } catch {
      if (!controller.signal.aborted) setError(strings.common.networkError)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const errs: Record<string, string> = {}
    if (!WS_SID_RE.test(workspaceSid.trim()))
      errs.workspaceSid = strings.common.workspaceSidInvalid
    if (mode === "sid" && !TASK_SID_RE.test(taskSid.trim()))
      errs.taskSid = strings.taskrouter.searchTasks.taskSidInvalid
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    void runSearch()
  }

  function clearHistory() {
    if (historyKey) clearStoredHistory(historyKey)
    setHistory([])
  }

  const searchAction = (
    <>
      <ActionButton
        action="search"
        aria-busy={loading}
        type="submit"
        disabled={!canSubmit}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Search className="size-3.5" />
        )}
        {strings.taskrouter.searchTasks.submit}
      </ActionButton>
    </>
  )

  return (
    <div className="workspace-page">
      <PageHeader
        title={strings.taskrouter.searchTasks.title}
        description={strings.taskrouter.searchTasks.subtitle}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}
      {contextMismatch && activeEnvironment && (
        <p role="status" className="mb-5 text-sm text-muted-foreground">
          {strings.common.contextEnvironmentMismatch}
        </p>
      )}

      {/* Mode toggle */}
      <div className="mb-4 flex rounded-lg border border-border bg-muted/40 p-0.5">
        <button
          aria-pressed={mode === "sid"}
          type="button"
          onClick={() => handleModeChange("sid")}
          className={cn(
            "focus-visible:outline-2 focus-visible:outline-ring",
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            mode === "sid"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {strings.taskrouter.searchTasks.modeSid}
        </button>
        <button
          aria-pressed={mode === "phone"}
          type="button"
          onClick={() => handleModeChange("phone")}
          className={cn(
            "focus-visible:outline-2 focus-visible:outline-ring",
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            mode === "phone"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {strings.taskrouter.searchTasks.modePhone}
        </button>
      </div>

      {/* Form */}
      <OperationForm
        onSubmit={handleSubmit}
        bodyClassName="space-y-6"
        actions={searchAction}
      >
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.searchTasks.workspaceSidLabel}
          </Label>
          <WorkspaceInput
            id="workspaceSid"
            className="search-control"
            aria-describedby={
              fieldErrors.workspaceSid
                ? "task-workspace-error task-workspace-hint"
                : "task-workspace-hint"
            }
            aria-invalid={!!fieldErrors.workspaceSid}
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(v) => {
              setWorkspaceSid(v)
              if (fieldErrors.workspaceSid)
                setFieldErrors((p) => {
                  const n = { ...p }
                  delete n.workspaceSid
                  return n
                })
            }}
            placeholder={strings.common.placeholders.workspaceSid}
            disabled={loading}
          />
          <p id="task-workspace-hint" className="text-xs text-muted-foreground">
            {strings.common.workspaceSidHint}
          </p>
          {fieldErrors.workspaceSid && (
            <p id="task-workspace-error" className="text-xs text-destructive">
              {fieldErrors.workspaceSid}
            </p>
          )}
        </div>

        {mode === "sid" ? (
          <div className="space-y-2">
            <Label htmlFor="taskSid">
              {strings.taskrouter.searchTasks.taskSidLabel}
            </Label>

            <SearchInput
              id="taskSid"
              aria-describedby="task-sid-feedback"
              value={taskSid}
              onChange={(e) => {
                setTaskSid(e.target.value)
                if (fieldErrors.taskSid)
                  setFieldErrors((p) => {
                    const n = { ...p }
                    delete n.taskSid
                    return n
                  })
              }}
              placeholder={strings.common.placeholders.taskSid}
              disabled={loading}
              className="min-w-0 flex-1 font-mono"
              aria-invalid={!!fieldErrors.taskSid}
            />

            {fieldErrors.taskSid ? (
              <p id="task-sid-feedback" className="text-xs text-destructive">
                {fieldErrors.taskSid}
              </p>
            ) : (
              <p
                id="task-sid-feedback"
                className="text-xs text-muted-foreground"
              >
                {strings.taskrouter.searchTasks.taskSidHint}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="phone">
              {strings.taskrouter.searchTasks.phoneLabel}
            </Label>

            <SearchInput
              id="phone"
              aria-describedby="task-phone-hint"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={strings.common.placeholders.phone}
              disabled={loading}
              className="min-w-0 flex-1"
            />

            <p id="task-phone-hint" className="text-xs text-muted-foreground">
              {strings.taskrouter.searchTasks.phoneLabelHint}
            </p>
          </div>
        )}
      </OperationForm>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {strings.common.processing}
        </div>
      )}

      {/* Results */}
      {tasks !== null && !loading && (
        <div className="mt-6 space-y-4">
          {mode === "phone" && (
            <p className="text-sm font-medium text-foreground">
              {tasks.length === 0
                ? strings.taskrouter.searchTasks.result.none
                : strings.taskrouter.searchTasks.result.count(tasks.length)}
            </p>
          )}
          {hasMore && (
            <p
              role="status"
              className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning"
            >
              {strings.taskrouter.searchTasks.result.limitWarning}
            </p>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.sid} task={task} />
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <RecentHistory onClear={clearHistory}>
          {history.map((h, i) => (
            <RecentHistoryItem
              key={i}
              onSelect={() => {
                const historyWorkspaceSid = h.workspaceSid ?? workspaceSid
                setWorkspaceSid(historyWorkspaceSid)
                setMode(h.mode)
                if (h.mode === "sid") setTaskSid(h.taskSid)
                else setPhone(h.phone)
                void runSearch(
                  h.mode,
                  h.mode === "sid" ? h.taskSid : h.phone,
                  historyWorkspaceSid
                )
              }}
              ariaLabel={strings.common.recentHistory.reuse}
            >
              <span className="tabular-nums">{fmtTs(h.ts)}</span>
              {" — "}
              {h.mode === "sid" ? (
                <>
                  <span className="font-mono font-semibold break-all text-foreground select-text">
                    {h.taskSid}
                  </span>
                  {" — "}
                  <span>{h.assignmentStatus}</span>
                  {h.taskQueueFriendlyName && (
                    <span> — {h.taskQueueFriendlyName}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="font-mono font-semibold text-foreground">
                    {h.phone}
                  </span>
                  {" — "}
                  <span>
                    {strings.taskrouter.searchTasks.history.itemPhone(h.count)}
                  </span>
                </>
              )}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
