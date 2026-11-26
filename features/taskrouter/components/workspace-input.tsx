"use client"

import * as React from "react"
import { ActionButton } from "@/components/action-button"
import { StoredInput } from "@/components/stored-input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import { isWorkspaceSummary } from "@/features/taskrouter/lib/workspace-storage"
import type {
  WorkspaceListResult,
  WorkspaceSummary,
} from "@/features/taskrouter/types"
import { strings } from "@/lib/strings"
import { useTaskrouterWorkspace } from "./workspace-context"

type WorkspaceInputProps = React.ComponentProps<typeof StoredInput>

export function WorkspaceInput(props: WorkspaceInputProps) {
  const context = useTaskrouterWorkspace()
  const { activeEnvironment } = useEnvironment()
  const [workspaces, setWorkspaces] = React.useState<WorkspaceSummary[] | null>(
    null
  )
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [choicesOpen, setChoicesOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])
  const labels = strings.taskrouter.workspace
  const selectedName =
    context?.selectedWorkspace?.sid === props.value.trim()
      ? context.selectedWorkspace.friendlyName
      : ""

  async function load(pageToken?: string) {
    if (!activeEnvironment || abortRef.current || props.disabled) return
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/taskrouter/workspaces/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
          ...(pageToken ? { pageToken } : {}),
        }),
      })
      const result = (await response.json()) as Partial<WorkspaceListResult> & {
        error?: string
      }
      if (controller.signal.aborted) return
      if (
        !response.ok ||
        !Array.isArray(result.workspaces) ||
        !result.workspaces.every(isWorkspaceSummary) ||
        (result.nextPageToken !== null &&
          typeof result.nextPageToken !== "string")
      )
        throw new Error()
      const loadedWorkspaces = result.workspaces
      setChoicesOpen(true)
      setWorkspaces((current) => [
        ...new Map(
          [...(pageToken ? (current ?? []) : []), ...loadedWorkspaces].map(
            (item) => [item.sid, item]
          )
        ).values(),
      ])
      setNextPageToken(result.nextPageToken ?? null)
    } catch {
      if (!controller.signal.aborted) setError(labels.loadError)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <StoredInput {...props} containerClassName="min-w-0 flex-1" />
        <ActionButton
          action="refresh"
          type="button"
          disabled={props.disabled || !activeEnvironment || loading}
          aria-busy={loading}
          onClick={() => {
            if (workspaces && !choicesOpen) setChoicesOpen(true)
            else void load()
          }}
        >
          {loading
            ? labels.loading
            : choicesOpen
              ? labels.refresh
              : labels.list}
        </ActionButton>
      </div>
      {/^WS[a-f0-9]{32}$/i.test(props.value.trim()) && (
        <p className="text-xs text-muted-foreground">
          {selectedName ? labels.selected(selectedName) : labels.remembered}
        </p>
      )}
      {workspaces && choicesOpen && (
        <div className="space-y-2">
          <Label htmlFor={`${props.id}-choices`}>{labels.choose}</Label>
          <Select
            id={`${props.id}-choices`}
            value={
              workspaces.some((item) => item.sid === props.value.trim())
                ? props.value.trim()
                : ""
            }
            disabled={props.disabled || loading}
            onChange={(event) => {
              const workspace = workspaces.find(
                (item) => item.sid === event.target.value
              )
              if (!workspace) return
              props.onChange(workspace.sid)
              context?.selectWorkspace(workspace)
              setChoicesOpen(false)
            }}
          >
            <option value="">{labels.placeholder}</option>
            {workspaces.map((workspace) => (
              <option key={workspace.sid} value={workspace.sid}>
                {labels.option(workspace.friendlyName, workspace.sid)}
              </option>
            ))}
          </Select>
          {workspaces.length === 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              {labels.empty}
            </p>
          )}
          {nextPageToken && (
            <ActionButton
              action="add"
              disabled={props.disabled || loading}
              onClick={() => void load(nextPageToken)}
            >
              {labels.more}
            </ActionButton>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
