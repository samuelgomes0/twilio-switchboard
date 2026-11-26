"use client"

import * as React from "react"
import { useBrowserState } from "@/components/use-browser-state"
import { useEnvironment } from "@/features/environments/context"
import {
  readSelectedWorkspace,
  saveSelectedWorkspace,
} from "@/features/taskrouter/lib/workspace-storage"
import type { WorkspaceSummary } from "@/features/taskrouter/types"

interface WorkspaceContextValue {
  selectedWorkspace: WorkspaceSummary | null
  selectWorkspace: (workspace: WorkspaceSummary) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

export function TaskrouterWorkspaceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeEnvironment } = useEnvironment()
  const environmentId = activeEnvironment?.id ?? ""
  const [selectedWorkspace, setSelectedWorkspace] =
    useBrowserState<WorkspaceSummary | null>(
      () => (environmentId ? readSelectedWorkspace(environmentId) : null),
      null,
      environmentId
    )
  function selectWorkspace(workspace: WorkspaceSummary) {
    if (!environmentId) return
    setSelectedWorkspace(workspace)
    saveSelectedWorkspace(environmentId, workspace)
  }
  return (
    <WorkspaceContext.Provider value={{ selectedWorkspace, selectWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useTaskrouterWorkspace() {
  return React.useContext(WorkspaceContext)
}

export function useWorkspaceSid(initialSid = "") {
  const context = useTaskrouterWorkspace()
  const [draft, setDraft] = React.useState<string | null>(initialSid || null)
  const workspaceSid = draft ?? context?.selectedWorkspace?.sid ?? ""
  function setWorkspaceSid(value: string) {
    setDraft(value)
    const sid = value.trim()
    if (/^WS[a-f0-9]{32}$/i.test(sid)) {
      context?.selectWorkspace({
        sid,
        friendlyName:
          context.selectedWorkspace?.sid === sid
            ? context.selectedWorkspace.friendlyName
            : "",
      })
    }
  }
  return [workspaceSid, setWorkspaceSid] as const
}
