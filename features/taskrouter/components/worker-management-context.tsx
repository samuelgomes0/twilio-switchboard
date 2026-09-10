"use client"

import * as React from "react"

export type WorkerManagementTab = "details" | "skills" | "features"

interface WorkerManagementValue {
  workspaceSid: string
  setWorkspaceSid: (value: string) => void
  selectedWorkerSid: string
  openWorkerAction: (
    tab: Exclude<WorkerManagementTab, "details">,
    sid: string
  ) => void
}

const WorkerManagementContext =
  React.createContext<WorkerManagementValue | null>(null)

export const WorkerManagementProvider = WorkerManagementContext.Provider

export function useWorkerManagement() {
  return React.useContext(WorkerManagementContext)
}
