"use client"

import * as React from "react"
import type { WorkerData } from "@/features/taskrouter/types"

export type WorkerManagementMode = "individual" | "batch"

export type WorkerManagementTab = "details" | "skills" | "features"

interface WorkerManagementValue {
  mode: WorkerManagementMode
  setMode: (mode: WorkerManagementMode) => void
  identifier: string
  setIdentifier: (identifier: string) => void
  selectedWorker: WorkerData | null
  setSelectedWorker: (
    worker: WorkerData | null,
    workspaceSid?: string,
    identifier?: string
  ) => void
  workerLoading: boolean
  setWorkerLoading: (loading: boolean) => void
  canWrite: boolean
  refreshRevision: number
  runningTab: Exclude<WorkerManagementTab, "details"> | null
  acquireOperation: (
    tab: Exclude<WorkerManagementTab, "details">,
    cancel: () => void
  ) => (() => void) | null
  workspaceSid: string
  setWorkspaceSid: (value: string) => void
  workers: string[]
  setWorkers: React.Dispatch<React.SetStateAction<string[]>>
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
