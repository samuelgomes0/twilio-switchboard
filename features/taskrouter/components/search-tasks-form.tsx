"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { StoredInput } from "@/components/stored-input"
import { useEnvironment } from "@/features/environments/context"
import type { SearchTaskResult, TaskData } from "@/features/taskrouter/types"
import { MAX_HISTORY } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchMode = "sid" | "phone"

interface SidHistoryEntry {
  ts: number
  mode: "sid"
  taskSid: string
  assignmentStatus: string
  taskQueueFriendlyName: string | null
}

interface PhoneHistoryEntry {
  ts: number
  mode: "phone"
  phone: string
  count: number
}

type HistoryEntry = SidHistoryEntry | PhoneHistoryEntry

// ─── Constants ───────────────────────────────────────────────────────────────

const HISTORY_KEY = "switchboard:search-tasks-history"
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i
const TASK_SID_RE = /^WT[a-fA-F0-9]{32}$/i

// ─── localStorage helpers ────────────────────────────────────────────────────

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

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: Date | null | string): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatAge(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

// ─── Channel inference ───────────────────────────────────────────────────────

function inferChannel(
  attributes: string,
  taskChannel: string | null
): "whatsapp" | "voice" | "unknown" {
  try {
    const attrs = JSON.parse(attributes) as Record<string, unknown>
    const from = typeof attrs.from === "string" ? attrs.from : ""
    if (from.startsWith("whatsapp:")) return "whatsapp"
    if (from.startsWith("+") || /^\d+$/.test(from)) return "voice"
  } catch {}
  if (taskChannel === "voice") return "voice"
  return "unknown"
}

function taskDataToResult(task: TaskData): SearchTaskResult {
  return {
    ...task,
    channel: inferChannel(task.attributes, task.taskChannelUniqueName),
  }
}

// ─── JSON block ──────────────────────────────────────────────────────────────

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function JsonBlock({ value }: { value: string }) {
  const parsed = tryParseJson(value)
  const isEmpty =
    parsed === null ||
    parsed === "" ||
    (typeof parsed === "object" && Object.keys(parsed as object).length === 0)
  if (isEmpty)
    return (
      <span className="text-xs text-muted-foreground italic">
        {strings.common.empty}
      </span>
    )
  return (
    <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  )
}

// ─── Badge variants ──────────────────────────────────────────────────────────

type BadgeVariant =
  | "success"
  | "warning"
  | "destructive"
  | "secondary"
  | "info"
  | "outline"

function statusVariant(s: string): BadgeVariant {
  if (s === "assigned") return "success"
  if (s === "reserved") return "info"
  if (s === "pending") return "warning"
  if (s === "wrapping") return "warning"
  if (s === "canceled") return "destructive"
  if (s === "completed") return "secondary"
  return "outline"
}

function channelLabel(channel: "whatsapp" | "voice" | "unknown"): string {
  if (channel === "whatsapp")
    return strings.taskrouter.searchTasks.result.channelWhatsapp
  if (channel === "voice")
    return strings.taskrouter.searchTasks.result.channelVoice
  return strings.taskrouter.searchTasks.result.channelUnknown
}

function channelVariant(
  channel: "whatsapp" | "voice" | "unknown"
): BadgeVariant {
  if (channel === "whatsapp") return "success"
  if (channel === "voice") return "info"
  return "outline"
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopySid({ sid }: { sid: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(sid).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title={strings.taskrouter.searchTasks.result.copySid}
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
      {copied
        ? strings.taskrouter.searchTasks.result.sidCopied
        : strings.taskrouter.searchTasks.result.copySid}
    </button>
  )
}

function TaskCard({ task }: { task: SearchTaskResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="font-mono text-sm leading-relaxed break-all">
              {task.sid}
            </CardTitle>
            <CopySid sid={task.sid} />
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {task.channel !== "unknown" && (
              <Badge variant={channelVariant(task.channel)}>
                {channelLabel(task.channel)}
              </Badge>
            )}
            <Badge variant={statusVariant(task.assignmentStatus)}>
              {task.assignmentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.priority}
            </p>
            <p className="font-medium">{task.priority}</p>
          </div>
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.age}
            </p>
            <p className="font-medium">{formatAge(task.age)}</p>
          </div>
          {task.workflowFriendlyName && (
            <div>
              <p className="mb-0.5 text-muted-foreground">
                {strings.taskrouter.searchTasks.result.workflow}
              </p>
              <p className="font-medium">{task.workflowFriendlyName}</p>
            </div>
          )}
          {task.taskQueueFriendlyName && (
            <div>
              <p className="mb-0.5 text-muted-foreground">
                {strings.taskrouter.searchTasks.result.queue}
              </p>
              <p className="font-medium">{task.taskQueueFriendlyName}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.dateCreated}
            </p>
            <p className="font-medium">{formatDate(task.dateCreated)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {strings.taskrouter.searchTasks.result.attributes}
          </p>
          <JsonBlock value={task.attributes} />
        </div>
      </CardContent>
    </Card>
  )
}

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
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

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

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return
    setLoading(true)
    setError(null)
    setTasks(null)

    try {
      if (mode === "sid") {
        const res = await fetch(
          `/api/taskrouter/fetch-task?workspaceSid=${encodeURIComponent(workspaceSid.trim())}&taskSid=${encodeURIComponent(taskSid.trim())}`,
          {
            headers: {
              "x-twilio-account-sid": activeEnvironment.accountSid,
              "x-twilio-auth-token": activeEnvironment.authToken,
            },
          }
        )
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
          taskSid: result.sid,
          assignmentStatus: result.assignmentStatus,
          taskQueueFriendlyName: result.taskQueueFriendlyName,
        }
        pushHistory(entry)
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      } else {
        const res = await fetch(
          `/api/taskrouter/search-tasks?workspaceSid=${encodeURIComponent(workspaceSid.trim())}&phoneNumber=${encodeURIComponent(phone.trim())}`,
          {
            headers: {
              "x-twilio-account-sid": activeEnvironment.accountSid,
              "x-twilio-auth-token": activeEnvironment.authToken,
            },
          }
        )
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
          phone: json.phone,
          count: json.tasks.length,
        }
        pushHistory(entry)
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.common.networkError)
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
          {strings.taskrouter.searchTasks.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Search className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {strings.taskrouter.searchTasks.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.searchTasks.subtitle}
          </p>
        </div>
      </div>

      {/* About */}
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {strings.taskrouter.searchTasks.about}
      </p>

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

      {/* Mode toggle */}
      <div className="mb-4 flex rounded-lg border border-border bg-muted/40 p-0.5">
        <button
          type="button"
          onClick={() => handleModeChange("sid")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            mode === "sid"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {strings.taskrouter.searchTasks.modeSid}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("phone")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            mode === "phone"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {strings.taskrouter.searchTasks.modePhone}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.searchTasks.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
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
            placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            disabled={loading}
          />
          {fieldErrors.workspaceSid && (
            <p className="text-xs text-destructive">
              {fieldErrors.workspaceSid}
            </p>
          )}
        </div>

        {mode === "sid" ? (
          <div className="space-y-2">
            <Label htmlFor="taskSid">
              {strings.taskrouter.searchTasks.taskSidLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                id="taskSid"
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
                placeholder="WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={loading}
                className="flex-1 font-mono text-sm"
                aria-invalid={!!fieldErrors.taskSid}
              />
              <Button
                type="submit"
                disabled={!canSubmit}
                className="shrink-0 gap-2"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                {strings.taskrouter.searchTasks.submit}
              </Button>
            </div>
            {fieldErrors.taskSid ? (
              <p className="text-xs text-destructive">{fieldErrors.taskSid}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {strings.taskrouter.searchTasks.taskSidHint}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="phone">
              {strings.taskrouter.searchTasks.phoneLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5511999999999"
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!canSubmit}
                className="shrink-0 gap-2"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                {strings.taskrouter.searchTasks.submit}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
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
              onClick={() => {
                setConfirmOpen(false)
                void runSearch()
              }}
            >
              {strings.common.search}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
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
        <div className="mt-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {strings.taskrouter.searchTasks.history.title}
            </p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {strings.taskrouter.searchTasks.history.clear}
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                {h.mode === "sid" ? (
                  <>
                    <span className="font-mono">
                      {h.taskSid.slice(0, 14)}...
                    </span>
                    {" · "}
                    <span>{h.assignmentStatus}</span>
                    {h.taskQueueFriendlyName && (
                      <span> · {h.taskQueueFriendlyName}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-mono">{h.phone}</span>
                    {" · "}
                    <span>
                      {strings.taskrouter.searchTasks.history.itemPhone(
                        h.count
                      )}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
