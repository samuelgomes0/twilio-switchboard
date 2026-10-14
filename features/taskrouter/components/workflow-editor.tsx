"use client"

import { ActionBar } from "@/components/action-bar"
import { ActionButton } from "@/components/action-button"
import { JsonBlock } from "@/components/json-block"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WarningBadge } from "@/components/warning-badge"
import { useEnvironment } from "@/features/environments/context"
import {
  getValidatedWorkflowQueueSids,
  parseWorkflowConfiguration,
  stringifyWorkflowConfiguration,
} from "@/features/taskrouter/lib/workflow-configuration"
import type {
  UpdateWorkflowResult,
  WorkflowDetails,
} from "@/features/taskrouter/types"
import { strings } from "@/lib/strings"
import { Loader2 } from "lucide-react"
import * as React from "react"

const labels = strings.taskrouter.workflows.edit

interface Draft {
  friendlyName: string
  assignmentCallbackUrl: string
  fallbackAssignmentCallbackUrl: string
  taskReservationTimeout: string
  configuration: string
  reEvaluateTasks: boolean
}

interface FieldErrors {
  friendlyName?: string
  assignmentCallbackUrl?: string
  fallbackAssignmentCallbackUrl?: string
  taskReservationTimeout?: string
  configuration?: string
}

interface Change {
  key: string
  field: string
  before: string
  after: string
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function displayCallback(value: string | null): string {
  return value ?? labels.notConfigured
}

function createDraft(workflow: WorkflowDetails): Draft {
  return {
    friendlyName: workflow.friendlyName,
    assignmentCallbackUrl: workflow.assignmentCallbackUrl ?? "",
    fallbackAssignmentCallbackUrl:
      workflow.fallbackAssignmentCallbackUrl ?? "",
    taskReservationTimeout: String(workflow.taskReservationTimeout),
    configuration: workflow.parsedConfiguration
      ? stringifyWorkflowConfiguration(workflow.parsedConfiguration, 2)
      : workflow.configuration,
    reEvaluateTasks: false,
  }
}

function isWorkflowDetails(value: unknown): value is WorkflowDetails {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.sid === "string" &&
    typeof record.workspaceSid === "string" &&
    typeof record.friendlyName === "string" &&
    (record.assignmentCallbackUrl === null ||
      typeof record.assignmentCallbackUrl === "string") &&
    (record.fallbackAssignmentCallbackUrl === null ||
      typeof record.fallbackAssignmentCallbackUrl === "string") &&
    typeof record.taskReservationTimeout === "number" &&
    typeof record.configuration === "string" &&
    (record.dateCreated === null || typeof record.dateCreated === "string") &&
    (record.dateUpdated === null || typeof record.dateUpdated === "string") &&
    (record.configurationIssue === null ||
      record.configurationIssue === "invalid-json" ||
      record.configurationIssue === "invalid-structure") &&
    (record.parsedConfiguration === null ||
      (typeof record.parsedConfiguration === "object" &&
        record.parsedConfiguration !== null &&
        !Array.isArray(record.parsedConfiguration)))
  )
}

export function WorkflowEditor({
  workflow,
  onCancel,
  onUpdated,
}: {
  workflow: WorkflowDetails
  onCancel: () => void
  onUpdated: (workflow: WorkflowDetails) => void
}) {
  const { activeEnvironment } = useEnvironment()
  const [draft, setDraft] = React.useState<Draft>(() => createDraft(workflow))
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [error, setError] = React.useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  const savingRef = React.useRef(false)

  React.useEffect(() => () => abortRef.current?.abort(), [])

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
    if (key in fieldErrors) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }))
    }
    setError(null)
  }

  function validateDraft(): {
    errors: FieldErrors
    normalizedConfiguration: string | null
    timeout: number | null
  } {
    const errors: FieldErrors = {}
    const friendlyName = draft.friendlyName.trim()
    if (!friendlyName || friendlyName.length > 256) {
      errors.friendlyName = labels.invalidName
    }

    for (const key of [
      "assignmentCallbackUrl",
      "fallbackAssignmentCallbackUrl",
    ] as const) {
      const value = draft[key].trim()
      if (value && (value.length > 2_048 || !isHttpUrl(value))) {
        errors[key] = labels.invalidCallback
      }
    }

    const timeout = Number(draft.taskReservationTimeout)
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 86_400) {
      errors.taskReservationTimeout = labels.invalidTimeout
    }

    const parsed = parseWorkflowConfiguration(draft.configuration)
    if (!parsed.ok) {
      errors.configuration = labels.invalidConfiguration
    } else if (getValidatedWorkflowQueueSids(parsed.configuration) === null) {
      errors.configuration = labels.invalidRouting
    }

    return {
      errors,
      normalizedConfiguration: parsed.ok
        ? stringifyWorkflowConfiguration(parsed.configuration, 2)
        : null,
      timeout: Number.isInteger(timeout) ? timeout : null,
    }
  }

  const parsedDraft = parseWorkflowConfiguration(draft.configuration)
  const currentConfiguration = workflow.parsedConfiguration
    ? stringifyWorkflowConfiguration(workflow.parsedConfiguration, 2)
    : workflow.configuration
  const nextConfiguration = parsedDraft.ok
    ? stringifyWorkflowConfiguration(parsedDraft.configuration, 2)
    : draft.configuration
  const configurationChanged = currentConfiguration !== nextConfiguration
  const changes: Change[] = []

  if (draft.friendlyName.trim() !== workflow.friendlyName) {
    changes.push({
      key: "friendlyName",
      field: labels.fields.friendlyName,
      before: workflow.friendlyName,
      after: draft.friendlyName.trim(),
    })
  }
  if (
    (draft.assignmentCallbackUrl.trim() || null) !==
    workflow.assignmentCallbackUrl
  ) {
    changes.push({
      key: "assignmentCallbackUrl",
      field: labels.fields.assignmentCallback,
      before: displayCallback(workflow.assignmentCallbackUrl),
      after: displayCallback(draft.assignmentCallbackUrl.trim() || null),
    })
  }
  if (
    (draft.fallbackAssignmentCallbackUrl.trim() || null) !==
    workflow.fallbackAssignmentCallbackUrl
  ) {
    changes.push({
      key: "fallbackAssignmentCallbackUrl",
      field: labels.fields.fallbackCallback,
      before: displayCallback(workflow.fallbackAssignmentCallbackUrl),
      after: displayCallback(
        draft.fallbackAssignmentCallbackUrl.trim() || null
      ),
    })
  }
  if (
    Number(draft.taskReservationTimeout) !== workflow.taskReservationTimeout
  ) {
    changes.push({
      key: "taskReservationTimeout",
      field: labels.fields.reservationTimeout,
      before: strings.taskrouter.workflows.timeoutSeconds(
        workflow.taskReservationTimeout
      ),
      after: strings.taskrouter.workflows.timeoutSeconds(
        Number(draft.taskReservationTimeout)
      ),
    })
  }
  if (configurationChanged) {
    changes.push({
      key: "configuration",
      field: labels.fields.configuration,
      before: labels.unchangedConfiguration,
      after: labels.changedConfiguration,
    })
  }
  if (draft.reEvaluateTasks) {
    changes.push({
      key: "reEvaluateTasks",
      field: labels.fields.reEvaluateTasks,
      before: labels.disabled,
      after: labels.enabled,
    })
  }

  function handleReview(event: React.FormEvent) {
    event.preventDefault()
    const validation = validateDraft()
    setFieldErrors(validation.errors)
    if (Object.keys(validation.errors).length > 0) return
    if (changes.length === 0) {
      setError(labels.noChanges)
      return
    }
    setError(null)
    setConfirmOpen(true)
  }

  async function save() {
    if (!activeEnvironment || !workflow.dateUpdated || savingRef.current) return
    const validation = validateDraft()
    if (
      Object.keys(validation.errors).length > 0 ||
      !validation.normalizedConfiguration ||
      validation.timeout === null
    ) {
      setFieldErrors(validation.errors)
      setConfirmOpen(false)
      return
    }

    savingRef.current = true
    setSaving(true)
    setError(null)
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    try {
      const response = await fetch("/api/taskrouter/workflows/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceSid: workflow.workspaceSid,
          workflowSid: workflow.sid,
          friendlyName: draft.friendlyName.trim(),
          assignmentCallbackUrl: draft.assignmentCallbackUrl.trim() || null,
          fallbackAssignmentCallbackUrl:
            draft.fallbackAssignmentCallbackUrl.trim() || null,
          taskReservationTimeout: validation.timeout,
          configuration: validation.normalizedConfiguration,
          reEvaluateTasks: draft.reEvaluateTasks,
          expectedDateUpdated: workflow.dateUpdated,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const data = (await response.json()) as Partial<UpdateWorkflowResult> & {
        error?: string
      }
      if (controller.signal.aborted) return
      if (!response.ok || data.error || !isWorkflowDetails(data.workflow)) {
        setError(data.error ?? strings.common.unknown)
        return
      }
      onUpdated(data.workflow)
    } catch {
      if (!controller.signal.aborted) setError(strings.common.networkError)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        savingRef.current = false
        setSaving(false)
        setConfirmOpen(false)
      }
    }
  }

  return (
    <section
      aria-labelledby="workflow-edit-heading"
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="workflow-edit-heading" className="text-base font-semibold">
              {labels.title}
            </h2>
            <WarningBadge />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {labels.description}
          </p>
        </div>
      </div>

      <form onSubmit={handleReview} className="space-y-6 p-4">
        <fieldset disabled={saving} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workflow-edit-name">{labels.friendlyName}</Label>
            <Input
              id="workflow-edit-name"
              value={draft.friendlyName}
              onChange={(event) =>
                updateDraft("friendlyName", event.target.value)
              }
              aria-invalid={!!fieldErrors.friendlyName}
              aria-describedby={
                fieldErrors.friendlyName ? "workflow-edit-name-error" : undefined
              }
            />
            {fieldErrors.friendlyName && (
              <p id="workflow-edit-name-error" className="text-xs text-destructive">
                {fieldErrors.friendlyName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-edit-timeout">
              {labels.reservationTimeout}
            </Label>
            <Input
              id="workflow-edit-timeout"
              type="number"
              min={1}
              max={86_400}
              step={1}
              value={draft.taskReservationTimeout}
              onChange={(event) =>
                updateDraft("taskReservationTimeout", event.target.value)
              }
              aria-invalid={!!fieldErrors.taskReservationTimeout}
              aria-describedby={
                fieldErrors.taskReservationTimeout
                  ? "workflow-edit-timeout-hint workflow-edit-timeout-error"
                  : "workflow-edit-timeout-hint"
              }
            />
            <p id="workflow-edit-timeout-hint" className="text-xs text-muted-foreground">
              {labels.reservationTimeoutHint}
            </p>
            {fieldErrors.taskReservationTimeout && (
              <p id="workflow-edit-timeout-error" className="text-xs text-destructive">
                {fieldErrors.taskReservationTimeout}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-edit-assignment">
              {labels.assignmentCallback}
            </Label>
            <Input
              id="workflow-edit-assignment"
              type="url"
              value={draft.assignmentCallbackUrl}
              onChange={(event) =>
                updateDraft("assignmentCallbackUrl", event.target.value)
              }
              placeholder={labels.callbackPlaceholder}
              aria-invalid={!!fieldErrors.assignmentCallbackUrl}
              aria-describedby={
                fieldErrors.assignmentCallbackUrl
                  ? "workflow-edit-assignment-hint workflow-edit-assignment-error"
                  : "workflow-edit-assignment-hint"
              }
            />
            <p id="workflow-edit-assignment-hint" className="text-xs text-muted-foreground">
              {labels.optionalCallback}
            </p>
            {fieldErrors.assignmentCallbackUrl && (
              <p id="workflow-edit-assignment-error" className="text-xs text-destructive">
                {fieldErrors.assignmentCallbackUrl}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-edit-fallback">
              {labels.fallbackCallback}
            </Label>
            <Input
              id="workflow-edit-fallback"
              type="url"
              value={draft.fallbackAssignmentCallbackUrl}
              onChange={(event) =>
                updateDraft("fallbackAssignmentCallbackUrl", event.target.value)
              }
              placeholder={labels.callbackPlaceholder}
              aria-invalid={!!fieldErrors.fallbackAssignmentCallbackUrl}
              aria-describedby={
                fieldErrors.fallbackAssignmentCallbackUrl
                  ? "workflow-edit-fallback-hint workflow-edit-fallback-error"
                  : "workflow-edit-fallback-hint"
              }
            />
            <p id="workflow-edit-fallback-hint" className="text-xs text-muted-foreground">
              {labels.optionalCallback}
            </p>
            {fieldErrors.fallbackAssignmentCallbackUrl && (
              <p id="workflow-edit-fallback-error" className="text-xs text-destructive">
                {fieldErrors.fallbackAssignmentCallbackUrl}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="workflow-edit-configuration">
              {labels.configuration}
            </Label>
            <Textarea
              id="workflow-edit-configuration"
              value={draft.configuration}
              onChange={(event) =>
                updateDraft("configuration", event.target.value)
              }
              spellCheck={false}
              className="min-h-80 font-mono text-xs leading-relaxed"
              aria-invalid={!!fieldErrors.configuration}
              aria-describedby={
                fieldErrors.configuration
                  ? "workflow-edit-configuration-hint workflow-edit-configuration-error"
                  : "workflow-edit-configuration-hint"
              }
            />
            <p id="workflow-edit-configuration-hint" className="text-xs text-muted-foreground">
              {labels.configurationHint}
            </p>
            {fieldErrors.configuration && (
              <p id="workflow-edit-configuration-error" className="text-xs text-destructive">
                {fieldErrors.configuration}
              </p>
            )}
          </div>

          <div className="rounded-md border border-warning/40 bg-warning-soft p-4 md:col-span-2">
            <label
              htmlFor="workflow-edit-reevaluate"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="workflow-edit-reevaluate"
                type="checkbox"
                checked={draft.reEvaluateTasks}
                onChange={(event) =>
                  updateDraft("reEvaluateTasks", event.target.checked)
                }
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium text-warning">
                  {labels.reEvaluateTasks}
                </span>
                <span className="mt-1 block text-xs text-warning">
                  {labels.reEvaluateTasksWarning}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        {changes.length > 0 && (
          <section aria-labelledby="workflow-edit-review-heading">
            <h3 id="workflow-edit-review-heading" className="text-sm font-semibold">
              {labels.reviewTitle}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {labels.reviewDescription}
            </p>
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              <div className="overflow-auto">
                <table className="min-w-[42rem] w-full text-sm">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left">
                        {labels.field}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left">
                        {labels.before}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left">
                        {labels.after}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((change) => (
                      <tr key={change.key} className="border-b border-border last:border-0">
                        <th scope="row" className="px-3 py-2 text-left font-medium">
                          {change.field}
                        </th>
                        <td className="px-3 py-2 text-muted-foreground break-all">
                          {change.before}
                        </td>
                        <td className="px-3 py-2 break-all">{change.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {configurationChanged && parsedDraft.ok && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium">{labels.before}</p>
                  <JsonBlock value={currentConfiguration} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium">{labels.after}</p>
                  <JsonBlock value={nextConfiguration} />
                </div>
              </div>
            )}
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <ActionBar>
          <ActionButton
            action="save"
            type="submit"
            disabled={!activeEnvironment || saving || !workflow.dateUpdated}
            aria-busy={saving}
          >
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            {saving ? labels.saving : labels.review}
          </ActionButton>
          <ActionButton action="cancel" onClick={onCancel} disabled={saving}>
            {labels.cancel}
          </ActionButton>
        </ActionBar>

        {!workflow.dateUpdated && (
          <p role="status" className="text-sm text-warning">
            {labels.missingVersion}
          </p>
        )}
      </form>

      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.confirmDescription(
                draft.friendlyName.trim(),
                workflow.workspaceSid
              )}
              {draft.reEvaluateTasks && ` ${labels.confirmReEvaluate}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>
              {strings.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void save()
              }}
              disabled={saving}
              className="gap-2"
            >
              {saving && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              {labels.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>
    </section>
  )
}
