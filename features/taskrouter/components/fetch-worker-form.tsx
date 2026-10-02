"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"
import { JsonBlock } from "@/components/json-block"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useEnvironment } from "@/features/environments/context"
import type { WorkerData } from "@/features/taskrouter/types"
import { MAX_HISTORY } from "@/lib/constants"
import { pushHistory, readHistory } from "@/lib/operation-history"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { useWorkerManagement } from "./worker-management-context"

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
const WS_SID_RE = /^WS[a-fA-F0-9]{32}$/i

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: Date | null | string): string {
  if (!d) return strings.common.notAvailable
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
  const management = useWorkerManagement()
  const { activeEnvironment } = useEnvironment()
  const [localWorkspaceSid, setLocalWorkspaceSid] = React.useState("")
  const workspaceSid = management?.workspaceSid ?? localWorkspaceSid
  const setWorkspaceSid = management?.setWorkspaceSid ?? setLocalWorkspaceSid
  const [identifier, setIdentifier] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [wsSidError, setWsSidError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<{ worker: WorkerData } | null>(null)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => readHistory<HistoryEntry>(HISTORY_KEY),
    []
  )
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    identifier.trim().length > 0 &&
    !loading &&
    !!activeEnvironment

  async function runSearch(
    requestedWorkspaceSid = workspaceSid.trim(),
    requestedIdentifier = identifier.trim()
  ) {
    if (
      loading ||
      !activeEnvironment ||
      !WS_SID_RE.test(requestedWorkspaceSid) ||
      !requestedIdentifier
    )
      return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch("/api/taskrouter/fetch-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSid: requestedWorkspaceSid,
          identifier: requestedIdentifier,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const json = (await res.json()) as { worker: WorkerData; error?: string }
      if (!res.ok || json.error) {
        setError(json.error ?? strings.common.unknown)
        return
      }
      setData(json)
      const entry: HistoryEntry = {
        ts: Date.now(),
        workspaceSid: requestedWorkspaceSid,
        identifier: requestedIdentifier,
        workerSid: json.worker.sid,
        friendlyName: json.worker.friendlyName,
        activityName: json.worker.activityName,
      }
      pushHistory(HISTORY_KEY, entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch {
      setError(strings.common.networkError)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (!WS_SID_RE.test(workspaceSid.trim())) {
      setWsSidError(strings.common.workspaceSidInvalid)
      return
    }
    setWsSidError(null)
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
    <div className="workspace-page">
      {/* Breadcrumb */}
      {!management && (
        <PageHeader
          title={strings.taskrouter.fetchWorker.title}
          description={strings.taskrouter.fetchWorker.subtitle}
          parent={{
            href: "/taskrouter",
            label: strings.sidebar.sections.taskrouter,
          }}
          embedded
        />
      )}

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      {/* Form */}
      <form onSubmit={handleSubmit} className="operation-form space-y-5">
        {!management && (
          <div data-worker-workspace-field className="space-y-2">
            <Label htmlFor="fetch-worker-workspace">
              {strings.taskrouter.fetchWorker.workspaceSidLabel}
            </Label>
            <StoredInput
              id="fetch-worker-workspace"
              className="search-control"
              aria-describedby={
                wsSidError ? "fetch-workspace-error" : undefined
              }
              aria-invalid={!!wsSidError}
              storageKey={WS_SIDS_KEY}
              environmentId={activeEnvironment?.id}
              value={workspaceSid}
              onChange={(v) => {
                setWorkspaceSid(v)
                if (wsSidError) setWsSidError(null)
              }}
              placeholder={strings.common.placeholders.workspaceSid}
              disabled={loading}
            />
            {wsSidError && (
              <p
                id="fetch-workspace-error"
                className="text-xs text-destructive"
              >
                {wsSidError}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="identifier">
            {strings.taskrouter.fetchWorker.identifierLabel}
          </Label>
          <InputActions>
            <StoredInput
              id="identifier"
              aria-describedby="worker-identifier-hint"
              storageKey={WORKER_IDS_KEY}
              environmentId={activeEnvironment?.id}
              value={identifier}
              onChange={setIdentifier}
              placeholder={strings.common.placeholders.worker}
              disabled={loading}
              containerClassName="w-full min-w-0 flex-1"
              className="search-control font-sans placeholder:font-sans"
            />
            <ActionBar>
              <ActionButton
                action="search"
                aria-busy={loading}
                type="submit"
                disabled={!canSubmit}
              >
                {loading ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search className="size-3.5" />
                )}
                {strings.common.search}
              </ActionButton>
            </ActionBar>
          </InputActions>
          <p
            id="worker-identifier-hint"
            className="text-xs text-muted-foreground"
          >
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
              {strings.taskrouter.fetchWorker.confirmDescription(
                identifier.trim(),
                activeEnvironment?.name ?? ""
              )}
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

      {/* Result */}
      {data && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm break-all text-muted-foreground">
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
              {management && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      management.openWorkerAction("skills", data.worker.sid)
                    }
                  >
                    {strings.taskrouter.workerManagement.actions.addSkill}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      management.openWorkerAction("features", data.worker.sid)
                    }
                  >
                    {
                      strings.taskrouter.workerManagement.actions
                        .configureFeature
                    }
                  </Button>
                </div>
              )}
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
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
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
                <div className="sm:col-span-2">
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
        <RecentHistory onClear={clearHistory}>
          {history.map((h, i) => (
            <RecentHistoryItem
              key={i}
              onSelect={() => {
                setWorkspaceSid(h.workspaceSid)
                setIdentifier(h.identifier)
                void runSearch(h.workspaceSid, h.identifier)
              }}
              ariaLabel={strings.common.recentHistory.reuse}
            >
              <span className="tabular-nums">{fmtTs(h.ts)}</span>
              {" — "}
              <span>{h.friendlyName}</span>
              {" — "}
              <span className="font-mono font-semibold break-all text-foreground select-text">
                {h.workerSid}
              </span>
              {" — "}
              <span>{h.activityName}</span>
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
