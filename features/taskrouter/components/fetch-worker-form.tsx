"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Loader2, AlertTriangle, User } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import type { WorkerData } from "@/features/taskrouter/types"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

interface HistoryEntry {
  ts: number
  workspaceSid: string
  identifier: string
  workerSid: string
  friendlyName: string
  activityName: string
}

const HISTORY_KEY = "switchboard:fetch-worker-history"
const WS_SIDS_KEY = STORED_KEYS.workspaceSids
const WORKER_IDS_KEY = STORED_KEYS.workerIdentifiers
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

type ActivityVariant = "success" | "secondary" | "outline"

function activityVariant(name: string): ActivityVariant {
  if (name === "Available") return "success"
  if (name === "Offline") return "secondary"
  return "outline"
}

interface WorkerRouting {
  skills?: string[]
  levels?: Record<string, number>
}

function parseRouting(attributes: string): WorkerRouting | null {
  try {
    const parsed = JSON.parse(attributes) as { routing?: WorkerRouting }
    return parsed.routing ?? null
  } catch {
    return null
  }
}

export function FetchWorkerForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [identifier, setIdentifier] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<{ worker: WorkerData } | null>(null)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    identifier.trim().length > 0 &&
    !loading &&
    !!activeEnvironment

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(
        `/api/taskrouter/fetch-worker?workspaceSid=${encodeURIComponent(workspaceSid.trim())}&identifier=${encodeURIComponent(identifier.trim())}`,
        {
          headers: {
            "x-twilio-account-sid": activeEnvironment.accountSid,
            "x-twilio-auth-token": activeEnvironment.authToken,
          },
        }
      )
      const json = (await res.json()) as { worker: WorkerData; error?: string }
      if (!res.ok || json.error) {
        setError(json.error ?? strings.common.unknown)
        return
      }
      setData(json)
      const entry: HistoryEntry = {
        ts: Date.now(),
        workspaceSid: workspaceSid.trim(),
        identifier: identifier.trim(),
        workerSid: json.worker.sid,
        friendlyName: json.worker.friendlyName,
        activityName: json.worker.activityName,
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

  const routing = data ? parseRouting(data.worker.attributes) : null

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
          {strings.taskrouter.fetchWorker.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <User className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {strings.taskrouter.fetchWorker.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.taskrouter.fetchWorker.subtitle}
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
            {strings.taskrouter.fetchWorker.workspaceSidLabel}
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
          <Label htmlFor="identifier">
            {strings.taskrouter.fetchWorker.identifierLabel}
          </Label>
          <div className="flex gap-2">
            <StoredInput
              id="identifier"
              storageKey={WORKER_IDS_KEY}
              environmentId={activeEnvironment?.id}
              value={identifier}
              onChange={setIdentifier}
              placeholder="WKxxxxx... ou agente@empresa.com"
              disabled={loading}
              containerClassName="flex-1"
              className="font-sans text-sm placeholder:font-sans"
            />
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <User className="size-3.5" />
              )}
              {strings.common.search}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {strings.taskrouter.fetchWorker.identifierHint}
          </p>
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.taskrouter.fetchWorker.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Buscar dados do worker{" "}
              <strong className="font-mono">{identifier}</strong> no ambiente{" "}
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
                <div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {data.worker.sid}
                  </p>
                  <CardTitle className="mt-1 text-base">
                    {data.worker.friendlyName}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activityVariant(data.worker.activityName)}>
                    {data.worker.activityName}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Skills */}
              {routing?.skills && routing.skills.length > 0 && (
                <>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {strings.taskrouter.fetchWorker.result.skills}
                    </p>
                    <ul className="space-y-1">
                      {routing.skills.map((skill) => (
                        <li
                          key={skill}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium">{skill}</span>
                          {routing.levels?.[skill] !== undefined && (
                            <span className="text-muted-foreground">
                              {strings.taskrouter.fetchWorker.result.level(
                                routing.levels[skill]
                              )}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                </>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchWorker.result.dateCreated}
                  </p>
                  <p className="font-medium">
                    {formatDate(data.worker.dateCreated)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchWorker.result.dateUpdated}
                  </p>
                  <p className="font-medium">
                    {formatDate(data.worker.dateUpdated)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="mb-0.5 text-muted-foreground">
                    {strings.taskrouter.fetchWorker.result.dateStatusChanged}
                  </p>
                  <p className="font-medium">
                    {formatDate(data.worker.dateStatusChanged)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Full attributes */}
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  {strings.taskrouter.fetchWorker.result.fullAttributes}
                </p>
                <JsonBlock value={data.worker.attributes} />
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
              {strings.taskrouter.fetchWorker.history.title}
            </p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {strings.taskrouter.fetchWorker.history.clear}
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                <span>{h.friendlyName}</span>
                {" · "}
                <span className="font-mono">{h.workerSid.slice(0, 10)}...</span>
                {" · "}
                <span>{h.activityName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
