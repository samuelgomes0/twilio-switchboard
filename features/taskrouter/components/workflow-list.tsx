"use client"

import { ActionBar } from "@/components/action-bar"
import { ActionButton } from "@/components/action-button"
import { EmptyState } from "@/components/empty-state"
import { InputActions } from "@/components/input-actions"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { StoredInput } from "@/components/stored-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type {
  WorkflowListResult,
  WorkflowSummary,
} from "@/features/taskrouter/types"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { Loader2, Search } from "lucide-react"
import Link from "next/link"
import * as React from "react"

const WORKSPACE_SID_RE = /^WS[a-fA-F0-9]{32}$/i
const WORKFLOW_SID_RE = /^WW[a-fA-F0-9]{32}$/i
const labels = strings.taskrouter.workflows

function formatDate(value: string | null): string {
  if (!value) return strings.common.notAvailable
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return strings.common.notAvailable
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function isWorkflowSummary(value: unknown): value is WorkflowSummary {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.sid === "string" &&
    typeof record.workspaceSid === "string" &&
    typeof record.friendlyName === "string" &&
    typeof record.taskReservationTimeout === "number"
  )
}

export function WorkflowList() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [workflows, setWorkflows] = React.useState<WorkflowSummary[] | null>(
    null
  )
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = React.useState<string | null>(
    null
  )
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const displayedWorkflows = React.useMemo(() => {
    if (!workflows) return null
    const query = search.trim().toLowerCase()
    if (!query) return workflows
    return workflows.filter(
      (workflow) =>
        workflow.friendlyName.toLowerCase().includes(query) ||
        workflow.sid.toLowerCase().includes(query)
    )
  }, [search, workflows])

  async function loadWorkflows(pageToken?: string) {
    const requestedWorkspaceSid = workspaceSid.trim()
    if (!activeEnvironment || !requestedWorkspaceSid || loading || loadingMore) {
      return
    }

    const append = !!pageToken
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setWorkflows(null)
      setNextPageToken(null)
    }
    setError(null)

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    try {
      const response = await fetch("/api/taskrouter/workflows/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceSid: requestedWorkspaceSid,
          ...(pageToken ? { pageToken } : {}),
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const data = (await response.json()) as Partial<WorkflowListResult> & {
        error?: string
      }
      if (controller.signal.aborted) return
      if (!response.ok || data.error) {
        setError(data.error ?? strings.common.unknown)
        return
      }
      if (
        !Array.isArray(data.workflows) ||
        !data.workflows.every(isWorkflowSummary) ||
        (data.nextPageToken !== null &&
          data.nextPageToken !== undefined &&
          typeof data.nextPageToken !== "string")
      ) {
        setError(strings.common.unknown)
        return
      }

      setWorkflows((current) => {
        if (!append || !current) return data.workflows ?? []
        const bySid = new Map(
          [...current, ...(data.workflows ?? [])].map((workflow) => [
            workflow.sid,
            workflow,
          ])
        )
        return [...bySid.values()]
      })
      setNextPageToken(data.nextPageToken ?? null)
    } catch {
      if (!controller.signal.aborted) setError(strings.common.networkError)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!WORKSPACE_SID_RE.test(workspaceSid.trim())) {
      setWorkspaceError(strings.common.workspaceSidInvalid)
      return
    }
    setWorkspaceError(null)
    void loadWorkflows()
  }

  const directWorkflowSid = WORKFLOW_SID_RE.test(search.trim())
    ? search.trim()
    : null

  return (
    <div className="workspace-page">
      <PageHeader
        title={labels.title}
        description={labels.subtitle}
        parent={{
          href: "/taskrouter",
          label: strings.sidebar.sections.taskrouter,
        }}
      />

      {!activeEnvironment && <NoEnvironmentSelected />}

      <form onSubmit={handleSubmit} className="operation-form space-y-2">
        <Label htmlFor="workflow-list-workspace">
          {labels.workspaceLabel}
        </Label>
        <InputActions>
          <StoredInput
            id="workflow-list-workspace"
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(value) => {
              setWorkspaceSid(value)
              if (workspaceError) setWorkspaceError(null)
            }}
            placeholder={strings.common.placeholders.workspaceSid}
            disabled={loading || loadingMore}
            aria-invalid={!!workspaceError}
            aria-describedby={
              workspaceError ? "workflow-list-workspace-error" : undefined
            }
            className="min-w-0 flex-1 font-mono"
          />
          <ActionBar>
            <ActionButton
              action="search"
              type="submit"
              disabled={
                !activeEnvironment ||
                !workspaceSid.trim() ||
                loading ||
                loadingMore
              }
              aria-busy={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-3.5" aria-hidden="true" />
              )}
              {labels.load}
            </ActionButton>
          </ActionBar>
        </InputActions>
        {workspaceError && (
          <p
            id="workflow-list-workspace-error"
            className="text-xs text-destructive"
          >
            {workspaceError}
          </p>
        )}
      </form>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {workflows !== null && displayedWorkflows !== null && (
        <section className="mt-6 space-y-4" aria-label={labels.table.caption}>
          <InputActions>
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label={labels.searchLabel}
              placeholder={labels.searchPlaceholder}
              className="min-w-0 flex-1"
            />
            <ActionBar>
              <ActionButton action="refresh" onClick={() => loadWorkflows()}>
                {strings.common.refresh}
              </ActionButton>
            </ActionBar>
          </InputActions>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p role="status">
              {search.trim()
                ? labels.countFiltered(
                    displayedWorkflows.length,
                    workflows.length
                  )
                : labels.count(workflows.length)}
            </p>
            {nextPageToken && <p>{labels.pageAvailable}</p>}
          </div>

          {displayedWorkflows.length === 0 ? (
            <EmptyState
              title={workflows.length === 0 ? labels.empty : labels.emptyFiltered}
            >
              {directWorkflowSid && (
                <Button asChild variant="outline">
                  <Link
                    href={{
                      pathname: `/taskrouter/workflows/${directWorkflowSid}`,
                      query: { workspaceSid: workspaceSid.trim() },
                    }}
                  >
                    {labels.openSid}
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-auto">
                <table className="min-w-[48rem] w-full text-sm">
                  <caption className="sr-only">{labels.table.caption}</caption>
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left">
                        {labels.table.name}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {labels.table.updated}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {labels.table.timeout}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        {labels.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWorkflows.map((workflow) => (
                      <tr
                        key={workflow.sid}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{workflow.friendlyName}</p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {workflow.sid}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(workflow.dateUpdated)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {labels.timeoutSeconds(
                            workflow.taskReservationTimeout
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="outline" size="xs">
                            <Link
                              href={{
                                pathname: `/taskrouter/workflows/${workflow.sid}`,
                                query: { workspaceSid: workspaceSid.trim() },
                              }}
                            >
                              {labels.open}
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {nextPageToken && (
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => loadWorkflows(nextPageToken)}
            >
              {loadingMore && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              {loadingMore ? labels.loadingMore : labels.loadMore}
            </Button>
          )}
        </section>
      )}
    </div>
  )
}
