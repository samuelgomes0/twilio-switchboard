"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronRight,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { useEnvironment } from "@/features/environments/context"
import type { TaskData } from "@/features/taskrouter/types"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

interface HistoryEntry {
  ts: number
  workspaceSid: string
  taskSid: string
  assignmentStatus: string
  taskQueueFriendlyName: string | null
}

const HISTORY_KEY = "switchboard:fetch-task-history"
const WS_SIDS_KEY = STORED_KEYS.workspaceSids
const MAX_HISTORY = 5

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
    <pre className="max-h-64 overflow-auto rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  )
}

type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "secondary"
  | "info"
  | "outline"

function statusVariant(s: string): StatusVariant {
  if (s === "assigned") return "success"
  if (s === "reserved") return "info"
  if (s === "pending") return "warning"
  if (s === "wrapping") return "warning"
  if (s === "canceled") return "destructive"
  if (s === "completed") return "secondary"
  return "outline"
}

export function FetchTaskForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [taskSid, setTaskSid] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<{ task: TaskData } | null>(null)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    taskSid.trim().length > 0 &&
    !loading &&
    !!activeEnvironment

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
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
      setData(json)
      const entry: HistoryEntry = {
        ts: Date.now(),
        workspaceSid: workspaceSid.trim(),
        taskSid: json.task.sid,
        assignmentStatus: json.task.assignmentStatus,
        taskQueueFriendlyName: json.task.taskQueueFriendlyName,
      }
      pushHistory(entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.common.networkError)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    setHistory([])
  }

  return (
    <div className="mx-auto max-w-2xl">
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
          {strings.taskrouter.fetchTask.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {strings.taskrouter.fetchTask.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.fetchTask.subtitle}
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
                href="/settings"
                className="underline underline-offset-2 hover:text-destructive"
              >
                {strings.common.noEnvironmentSelected.link}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">
            {strings.taskrouter.fetchTask.workspaceSidLabel}
          </Label>
          <StoredInput
            id="workspaceSid"
            storageKey={WS_SIDS_KEY}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={setWorkspaceSid}
            placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taskSid">
            {strings.taskrouter.fetchTask.taskSidLabel}
          </Label>
          <div className="flex gap-2">
            <Input
              id="taskSid"
              value={taskSid}
              onChange={(e) => setTaskSid(e.target.value)}
              placeholder="WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={loading}
              className="flex-1 font-mono text-sm"
            />
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ClipboardList className="size-3.5" />
              )}
              {strings.common.search}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {strings.taskrouter.fetchTask.taskSidHint}
          </p>
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.taskrouter.fetchTask.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Buscar dados da task{" "}
              <strong className="font-mono">{taskSid}</strong> no ambiente{" "}
              <strong>{activeEnvironment?.name}</strong>?
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

      {/* Result */}
      {data && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="font-mono text-sm leading-relaxed">
                  {data.task.sid}
                </CardTitle>
                <Badge variant={statusVariant(data.task.assignmentStatus)}>
                  {data.task.assignmentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchTask.result.priority}
                  </p>
                  <p className="font-medium">{data.task.priority}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchTask.result.age}
                  </p>
                  <p className="font-medium">{formatAge(data.task.age)}</p>
                </div>
                {data.task.taskChannelUniqueName && (
                  <div>
                    <p className="mb-0.5 text-muted-foreground">
                      {strings.taskrouter.fetchTask.result.channel}
                    </p>
                    <p className="font-medium">
                      {data.task.taskChannelUniqueName}
                    </p>
                  </div>
                )}
                {data.task.workflowFriendlyName && (
                  <div>
                    <p className="mb-0.5 text-muted-foreground">
                      {strings.taskrouter.fetchTask.result.workflow}
                    </p>
                    <p className="font-medium">
                      {data.task.workflowFriendlyName}
                    </p>
                  </div>
                )}
                {data.task.taskQueueFriendlyName && (
                  <div className="col-span-2">
                    <p className="mb-0.5 text-muted-foreground">
                      {strings.taskrouter.fetchTask.result.queue}
                    </p>
                    <p className="font-medium">
                      {data.task.taskQueueFriendlyName}
                    </p>
                  </div>
                )}
                {data.task.reason && (
                  <div className="col-span-2">
                    <p className="mb-0.5 text-muted-foreground">
                      {strings.taskrouter.fetchTask.result.reason}
                    </p>
                    <p className="font-medium">{data.task.reason}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchTask.result.dateCreated}
                  </p>
                  <p className="font-medium">
                    {formatDate(data.task.dateCreated)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchTask.result.dateUpdated}
                  </p>
                  <p className="font-medium">
                    {formatDate(data.task.dateUpdated)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  {strings.taskrouter.fetchTask.result.attributes}
                </p>
                <JsonBlock value={data.task.attributes} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {strings.taskrouter.fetchTask.history.title}
            </p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {strings.taskrouter.fetchTask.history.clear}
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                <span className="font-mono">{h.taskSid.slice(0, 14)}...</span>
                {" · "}
                <span>{h.assignmentStatus}</span>
                {h.taskQueueFriendlyName && (
                  <span> · {h.taskQueueFriendlyName}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
