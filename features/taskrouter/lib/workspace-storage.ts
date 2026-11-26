import type { WorkspaceSummary } from "@/features/taskrouter/types"
import { readStorageJson, writeStorageJson } from "@/lib/browser-storage"

const WORKSPACE_KEY = "switchboard:taskrouter-workspace"

export function isWorkspaceSummary(value: unknown): value is WorkspaceSummary {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false
  const record = value as Record<string, unknown>
  return (
    typeof record.sid === "string" &&
    /^WS[a-f0-9]{32}$/i.test(record.sid) &&
    typeof record.friendlyName === "string" &&
    record.friendlyName.length <= 256
  )
}

export function readSelectedWorkspace(
  environmentId: string
): WorkspaceSummary | null {
  if (!environmentId) return null
  return readStorageJson(
    `${WORKSPACE_KEY}:${environmentId}`,
    (value): value is WorkspaceSummary | null =>
      value === null || isWorkspaceSummary(value),
    null
  )
}

export function saveSelectedWorkspace(
  environmentId: string,
  workspace: WorkspaceSummary
): boolean {
  if (!environmentId || !isWorkspaceSummary(workspace)) return false
  return writeStorageJson(`${WORKSPACE_KEY}:${environmentId}`, workspace)
}
