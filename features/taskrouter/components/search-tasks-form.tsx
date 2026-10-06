"use client"
import { useBrowserState } from "@/components/use-browser-state"
import { TaskCard } from "./task-result-card"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { inferChannel } from "@/features/taskrouter/lib/infer-channel"

import { Loader2, Search } from "lucide-react"
import * as React from "react"

import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
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
import { SearchInput } from "@/components/search-input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type { SearchTaskResult, TaskData } from "@/features/taskrouter/types"
import { MAX_HISTORY } from "@/lib/constants"
import { pushHistory, readHistory } from "@/lib/operation-history"
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

export function SearchTasksForm() {
  const { activeEnvironment } = useEnvironment()
  const [mode, setMode] = React.useState<SearchMode>("sid")
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [taskSid, setTaskSid] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [tasks, setTasks] = React.useState<SearchTaskResult[] | null>(null)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => readHistory<HistoryEntry>(HISTORY_KEY),
    []
  )
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  function handleModeChange(newMode: SearchMode) {
    if (newMode === mode) return
    setMode(newMode)
    setTaskSid("")
    setPhone("")
    setTasks(null)
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
      !requestedWorkspaceSid ||
      !requestedValue
    )
      return
    setLoading(true)
    setError(null)
    setTasks(null)

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
        })
        const json = (await res.json()) as { task: TaskData; error?: string }
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
        pushHistory(HISTORY_KEY, entry)
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
        })
        const json = (await res.json()) as {
          tasks: SearchTaskResult[]
          phone: string
          error?: string
        }
        if (!res.ok || json.error) {
          setError(json.error ?? strings.common.unknown)
          return
        }
        setTasks(json.tasks)
        const entry: PhoneHistoryEntry = {
          ts: Date.now(),
          mode: "phone",
          workspaceSid: requestedWorkspaceSid,
          phone: json.phone,
          count: json.tasks.length,
        }
        pushHistory(HISTORY_KEY, entry)
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      }
    } catch {
      setError(strings.common.networkError)
    } finally {
      setLoading(false)
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
    setConfirmOpen(true)
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    setHistory([])
  }

  const confirmTitle =
    mode === "sid"
      ? strings.taskrouter.searchTasks.confirmSidTitle
      : strings.taskrouter.searchTasks.confirmPhoneTitle

  const confirmDescription =
    mode === "sid"
      ? strings.taskrouter.searchTasks.confirmSidDescription(
          taskSid.trim(),
          activeEnvironment?.name ?? ""
        )
      : strings.taskrouter.searchTasks.confirmPhoneDescription(
          phone.trim(),
          activeEnvironment?.name ?? ""
        )

  const searchAction = (
    <ActionBar>
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
    </ActionBar>
  )

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.taskrouter.searchTasks.title}
        description={strings.taskrouter.searchTasks.subtitle}
        parent={{
          href: "/taskrouter",
          label: strings.sidebar.sections.taskrouter,
        }}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

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
      <form onSubmit={handleSubmit} className="operation-form space-y-5">
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.searchTasks.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            className="search-control"
            aria-describedby={
              fieldErrors.workspaceSid ? "task-workspace-error" : undefined
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
            <InputActions>
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
              {searchAction}
            </InputActions>
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
            <InputActions>
              <SearchInput
                id="phone"
                aria-describedby="task-phone-hint"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={strings.common.placeholders.phone}
                disabled={loading}
                className="min-w-0 flex-1"
              />
              {searchAction}
            </InputActions>
            <p id="task-phone-hint" className="text-xs text-muted-foreground">
              {strings.taskrouter.searchTasks.phoneLabelHint}
            </p>
          </div>
        )}
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2"
              onClick={() => {
                setConfirmOpen(false)
                void runSearch()
              }}
            >
              <Search aria-hidden="true" className="size-3.5" />
              {strings.common.search}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

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
