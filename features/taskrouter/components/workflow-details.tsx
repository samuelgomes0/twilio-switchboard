"use client"

import { ActionBar } from "@/components/action-bar"
import { ActionButton } from "@/components/action-button"
import { InputActions } from "@/components/input-actions"
import { JsonBlock } from "@/components/json-block"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { StoredInput } from "@/components/stored-input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type {
  WorkflowDetails as WorkflowDetailsData,
  WorkflowFilter,
} from "@/features/taskrouter/types"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { Loader2, Search } from "lucide-react"
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

function filterName(filter: WorkflowFilter, index: number): string {
  return (
    filter.filter_friendly_name ??
    filter.friendly_name ??
    labels.details.unnamedFilter(index + 1)
  )
}

export function WorkflowDetails({
  initialWorkflowSid = "",
  initialWorkspaceSid = "",
}: {
  initialWorkflowSid?: string
  initialWorkspaceSid?: string
}) {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState(initialWorkspaceSid)
  const [workflowSid, setWorkflowSid] = React.useState(initialWorkflowSid)
  const [workflow, setWorkflow] = React.useState<WorkflowDetailsData | null>(
    null
  )
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{
    workspaceSid?: string
    workflowSid?: string
  }>({})
  const abortRef = React.useRef<AbortController | null>(null)
  const autoLoadedRef = React.useRef(false)

  const loadWorkflow = React.useCallback(
    async (
      requestedWorkspaceSid = workspaceSid.trim(),
      requestedWorkflowSid = workflowSid.trim()
    ) => {
      if (!activeEnvironment || loading) return
      setLoading(true)
      setError(null)
      setWorkflow(null)
      const controller = new AbortController()
      abortRef.current?.abort()
      abortRef.current = controller

      try {
        const response = await fetch("/api/taskrouter/workflows/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            workspaceSid: requestedWorkspaceSid,
            workflowSid: requestedWorkflowSid,
            accountSid: activeEnvironment.accountSid,
            authToken: activeEnvironment.authToken,
          }),
        })
        const data = (await response.json()) as {
          workflow?: WorkflowDetailsData
          error?: string
        }
        if (controller.signal.aborted) return
        if (!response.ok || data.error || !data.workflow) {
          setError(data.error ?? strings.common.unknown)
          return
        }
        setWorkflow(data.workflow)
      } catch {
        if (!controller.signal.aborted) setError(strings.common.networkError)
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setLoading(false)
        }
      }
    },
    [activeEnvironment, loading, workflowSid, workspaceSid]
  )

  React.useEffect(() => () => abortRef.current?.abort(), [])

  React.useEffect(() => {
    if (
      !autoLoadedRef.current &&
      activeEnvironment &&
      WORKSPACE_SID_RE.test(initialWorkspaceSid) &&
      WORKFLOW_SID_RE.test(initialWorkflowSid)
    ) {
      autoLoadedRef.current = true
      void loadWorkflow(initialWorkspaceSid, initialWorkflowSid)
    }
  }, [
    activeEnvironment,
    initialWorkflowSid,
    initialWorkspaceSid,
    loadWorkflow,
  ])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const errors: typeof fieldErrors = {}
    if (!WORKSPACE_SID_RE.test(workspaceSid.trim())) {
      errors.workspaceSid = strings.common.workspaceSidInvalid
    }
    if (!WORKFLOW_SID_RE.test(workflowSid.trim())) {
      errors.workflowSid = strings.common.validation.invalidWorkflowSid
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    void loadWorkflow()
  }

  const filters = workflow?.parsedConfiguration?.task_routing.filters ?? []
  const defaultQueue =
    workflow?.parsedConfiguration?.task_routing.default_filter?.queue ?? null

  return (
    <div className="workspace-page">
      <PageHeader
        title={labels.details.title}
        description={labels.details.subtitle}
        parent={{ href: "/taskrouter/workflows", label: labels.title }}
      />

      {!activeEnvironment && <NoEnvironmentSelected />}

      <form onSubmit={handleSubmit} className="operation-form form-grid">
        <div className="space-y-2">
          <Label htmlFor="workflow-details-workspace">
            {labels.workspaceLabel}
          </Label>
          <StoredInput
            id="workflow-details-workspace"
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={(value) => {
              setWorkspaceSid(value)
              if (fieldErrors.workspaceSid) {
                setFieldErrors((current) => ({
                  ...current,
                  workspaceSid: undefined,
                }))
              }
            }}
            placeholder={strings.common.placeholders.workspaceSid}
            disabled={loading}
            aria-invalid={!!fieldErrors.workspaceSid}
            aria-describedby={
              fieldErrors.workspaceSid
                ? "workflow-details-workspace-error"
                : undefined
            }
            className="font-mono"
          />
          {fieldErrors.workspaceSid && (
            <p
              id="workflow-details-workspace-error"
              className="text-xs text-destructive"
            >
              {fieldErrors.workspaceSid}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="workflow-details-sid">
            {labels.workflowSidLabel}
          </Label>
          <InputActions>
            <SearchInput
              id="workflow-details-sid"
              value={workflowSid}
              onChange={(event) => {
                setWorkflowSid(event.target.value)
                if (fieldErrors.workflowSid) {
                  setFieldErrors((current) => ({
                    ...current,
                    workflowSid: undefined,
                  }))
                }
              }}
              placeholder={strings.common.placeholders.workflowSid}
              disabled={loading}
              aria-invalid={!!fieldErrors.workflowSid}
              aria-describedby={
                fieldErrors.workflowSid
                  ? "workflow-details-sid-error"
                  : undefined
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
                  !workflowSid.trim() ||
                  loading
                }
                aria-busy={loading}
              >
                {loading ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search className="size-3.5" aria-hidden="true" />
                )}
                {labels.details.submit}
              </ActionButton>
            </ActionBar>
          </InputActions>
          {fieldErrors.workflowSid && (
            <p
              id="workflow-details-sid-error"
              className="text-xs text-destructive"
            >
              {fieldErrors.workflowSid}
            </p>
          )}
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {workflow && !loading && (
        <div className="mt-6 space-y-6">
          <section aria-labelledby="workflow-general-heading">
            <h2 id="workflow-general-heading" className="text-base font-semibold">
              {labels.details.general}
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.friendlyName}
                </dt>
                <dd className="mt-1 font-medium">{workflow.friendlyName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.workflowSid}
                </dt>
                <dd className="mt-1 font-mono text-sm break-all">
                  {workflow.sid}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.workspaceSid}
                </dt>
                <dd className="mt-1 font-mono text-sm break-all">
                  {workflow.workspaceSid}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.createdAt}
                </dt>
                <dd className="mt-1 text-sm">
                  {formatDate(workflow.dateCreated)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.updatedAt}
                </dt>
                <dd className="mt-1 text-sm">
                  {formatDate(workflow.dateUpdated)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {labels.details.reservationTimeout}
                </dt>
                <dd className="mt-1 text-sm tabular-nums">
                  {labels.timeoutSeconds(workflow.taskReservationTimeout)}
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs text-muted-foreground">
                  {labels.details.assignmentCallback}
                </dt>
                <dd className="mt-1 text-sm break-all">
                  {workflow.assignmentCallbackUrl ?? strings.common.notAvailable}
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs text-muted-foreground">
                  {labels.details.fallbackCallback}
                </dt>
                <dd className="mt-1 text-sm break-all">
                  {workflow.fallbackAssignmentCallbackUrl ??
                    strings.common.notAvailable}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="workflow-routing-heading">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="workflow-routing-heading"
                className="text-base font-semibold"
              >
                {labels.details.routing}
              </h2>
              {workflow.parsedConfiguration && (
                <>
                  <Badge variant="secondary">
                    {labels.details.filters(filters.length)}
                  </Badge>
                  <Badge variant="secondary">
                    {labels.details.targets(
                      filters.reduce(
                        (total, filter) =>
                          total + (filter.targets?.length ?? 0),
                        0
                      )
                    )}
                  </Badge>
                </>
              )}
            </div>

            {!workflow.parsedConfiguration ? (
              <div
                role="status"
                className="mt-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning"
              >
                {workflow.configurationIssue === "invalid-json"
                  ? labels.details.invalidJson
                  : labels.details.malformedConfiguration}
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {labels.details.defaultQueue}: {" "}
                  </span>
                  <span className="font-mono">
                    {defaultQueue ?? labels.details.noDefaultQueue}
                  </span>
                </p>

                {filters.length === 0 ? (
                  <p className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">
                    {labels.details.noFilters}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="overflow-auto">
                      <table className="min-w-[46rem] w-full text-sm">
                        <thead className="border-b border-border bg-muted">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left">
                              {labels.details.filter}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                              {labels.details.expression}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                              {labels.details.queues}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filters.map((filter, index) => (
                            <tr
                              key={`${filterName(filter, index)}-${index}`}
                              className="border-b border-border last:border-0"
                            >
                              <td className="px-4 py-3 font-medium">
                                {filterName(filter, index)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs break-all">
                                {filter.expression ?? strings.common.notAvailable}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs break-all">
                                {(filter.targets ?? [])
                                  .map((target) => target.queue)
                                  .filter((queue): queue is string => !!queue)
                                  .join(", ") || strings.common.notAvailable}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <details className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              {labels.details.rawConfiguration}
            </summary>
            <JsonBlock value={workflow.configuration} className="mt-4 max-h-[32rem] overflow-auto rounded-md bg-muted/60 p-4 text-xs leading-relaxed" />
          </details>
        </div>
      )}
    </div>
  )
}
