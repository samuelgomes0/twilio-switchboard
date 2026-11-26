"use client"

import * as React from "react"
import { Tabs } from "radix-ui"
import {
  useOperationDraft,
  useUnsavedChanges,
} from "@/components/use-operation-draft"
import { PageHeader } from "@/components/page-header"
import { ActionButton } from "@/components/action-button"
import { StoredInput } from "@/components/stored-input"
import { Label } from "@/components/ui/label"
import { WarningBadge } from "@/components/warning-badge"
import { useEnvironment } from "@/features/environments/context"
import type { WorkerData } from "@/features/taskrouter/types"
import { MAX_ITEMS } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { AssignWorkersForm } from "./assign-workers-form"
import { FetchWorkerForm } from "./fetch-worker-form"
import { UpdateWorkerFeatureForm } from "./update-worker-feature-form"
import { WorkerCurrentConfiguration } from "./worker-current-configuration"
import { useWorkspaceSid } from "./workspace-context"
import { WorkspaceInput } from "./workspace-input"
import {
  WorkerManagementProvider,
  type WorkerManagementTab,
  type WorkerManagementMode,
} from "./worker-management-context"

export function WorkerManagementForm({
  initialTab = "details",
  initialMode,
}: {
  initialTab?: WorkerManagementTab
  initialMode?: WorkerManagementMode
}) {
  const labels = strings.taskrouter.workerManagement
  const { activeEnvironment } = useEnvironment()
  const [mode, setModeState] = React.useState<WorkerManagementMode>(
    initialMode ?? (initialTab === "details" ? "individual" : "batch")
  )
  const [tab, setTab] = React.useState<WorkerManagementTab>(
    mode === "batch" && initialTab === "details" ? "skills" : initialTab
  )
  const [workspaceSid, updateWorkspaceSid] = useWorkspaceSid()
  const [identifier, updateIdentifier] = useOperationDraft(
    "",
    `${activeEnvironment?.id}:worker:identifier`
  )
  const [batchWorkers, setBatchWorkers] = useOperationDraft<string[]>(
    [""],
    `${activeEnvironment?.id}:worker:batch`
  )
  const [snapshot, setSnapshot] = React.useState<{
    worker: WorkerData
    workspaceSid: string
    identifier: string
  } | null>(null)
  const [workerLoading, setWorkerLoading] = React.useState(false)
  const [refreshRevision, setRefreshRevision] = React.useState(0)
  const [runningTab, setRunningTab] = React.useState<Exclude<
    WorkerManagementTab,
    "details"
  > | null>(null)
  useUnsavedChanges(
    runningTab !== null || batchWorkers.some((value) => !!value.trim())
  )
  const operationRef = React.useRef<{ cancel: () => void } | null>(null)
  const selectedWorker =
    mode === "individual" &&
    snapshot?.workspaceSid === workspaceSid.trim() &&
    snapshot.identifier === identifier.trim()
      ? snapshot.worker
      : null
  const workers =
    mode === "individual"
      ? selectedWorker
        ? [selectedWorker.sid]
        : []
      : batchWorkers
  const canWrite = mode === "batch" || (!!selectedWorker && !workerLoading)

  function setWorkspaceSid(value: string) {
    if (!operationRef.current) updateWorkspaceSid(value)
  }
  function setIdentifier(value: string) {
    if (!operationRef.current) updateIdentifier(value)
  }
  function setWorkers(value: React.SetStateAction<string[]>) {
    if (!operationRef.current) setBatchWorkers(value)
  }
  function setSelectedWorker(
    worker: WorkerData | null,
    requestedWorkspace = workspaceSid.trim(),
    requestedIdentifier = identifier.trim()
  ) {
    setSnapshot(
      worker
        ? {
            worker,
            workspaceSid: requestedWorkspace,
            identifier: requestedIdentifier,
          }
        : null
    )
  }
  function updateUrl(
    nextMode: WorkerManagementMode,
    nextTab: WorkerManagementTab
  ) {
    const url = new URL(window.location.href)
    url.searchParams.set("mode", nextMode)
    url.searchParams.set("tab", nextTab)
    window.history.replaceState(null, "", url)
  }
  function selectTab(nextTab: WorkerManagementTab) {
    if (mode === "batch" && nextTab === "details") return
    if (mode === "individual" && nextTab !== "details" && !selectedWorker)
      return
    setTab(nextTab)
    updateUrl(mode, nextTab)
  }
  function setMode(nextMode: WorkerManagementMode) {
    if (operationRef.current || nextMode === mode) return
    const nextTab = nextMode === "individual" ? "details" : "skills"
    setModeState(nextMode)
    if (nextMode === "individual") {
      setSnapshot(null)
      setRefreshRevision((previous) => previous + 1)
    }
    setTab(nextTab)
    updateUrl(nextMode, nextTab)
  }
  function acquireOperation(
    nextTab: Exclude<WorkerManagementTab, "details">,
    cancel: () => void
  ) {
    if (operationRef.current || !canWrite) return null
    const operation = { cancel }
    operationRef.current = operation
    setRunningTab(nextTab)
    return () => {
      if (operationRef.current !== operation) return
      operationRef.current = null
      setRunningTab(null)
      if (mode === "individual") setRefreshRevision((previous) => previous + 1)
    }
  }
  const tabs =
    mode === "batch"
      ? (["skills", "features"] as const)
      : (["details", "skills", "features"] as const)
  const activeTab =
    mode === "individual" && !selectedWorker && !runningTab ? "details" : tab
  const navigation = (
    <Tabs.List aria-label={labels.tabsLabel} className="tab-list">
      {tabs.map((value) => (
        <Tabs.Trigger key={value} value={value} className="tab-trigger">
          {labels.tabs[value]}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  )
  const actionKey = `${mode}:${workspaceSid}:${mode === "individual" ? identifier : batchWorkers.join(",")}`

  return (
    <WorkerManagementProvider
      value={{
        mode,
        setMode,
        identifier,
        setIdentifier,
        selectedWorker,
        setSelectedWorker,
        workerLoading,
        setWorkerLoading,
        canWrite,
        refreshRevision,
        runningTab,
        acquireOperation,
        workspaceSid,
        setWorkspaceSid,
        workers,
        setWorkers,
        openWorkerAction(nextTab, sid) {
          if (!operationRef.current && selectedWorker?.sid === sid)
            selectTab(nextTab)
        },
      }}
    >
      <div className="workspace-page">
        <PageHeader
          title={labels.title}
          description={labels.subtitle}
          badge={activeTab !== "details" && <WarningBadge />}
        />
        <div
          role="group"
          aria-label={labels.modeLabel}
          className="mb-4 flex rounded-lg border border-border bg-muted/40 p-0.5"
        >
          {(["individual", "batch"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                "focus-visible:outline-2 focus-visible:outline-ring",
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
                mode === value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={mode === value}
              disabled={!!runningTab}
              onClick={() => setMode(value)}
            >
              {labels.modes[value]}
            </button>
          ))}
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          {mode === "individual" ? labels.individualHint : labels.batchHint}
        </p>
        {runningTab && (
          <div
            role="status"
            className="mb-5 space-y-3 rounded-lg border border-info/40 bg-info-soft px-4 py-3 text-sm"
          >
            <p>{labels.operationRunning}</p>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                action="primary"
                onClick={() => selectTab(runningTab)}
              >
                {labels.viewOperation}
              </ActionButton>
              <ActionButton
                action="stop"
                onClick={() => operationRef.current?.cancel()}
              >
                {strings.common.cancel}
              </ActionButton>
            </div>
          </div>
        )}
        <fieldset
          disabled={!!runningTab}
          className="worker-context mb-6 space-y-2"
        >
          <Label htmlFor="worker-management-workspace">
            {labels.workspaceLabel}
          </Label>
          <WorkspaceInput
            id="worker-management-workspace"
            aria-describedby="worker-management-workspace-hint"
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={setWorkspaceSid}
            disabled={!!runningTab}
            placeholder={labels.workspacePlaceholder}
          />
          <p
            id="worker-management-workspace-hint"
            className="text-xs text-muted-foreground"
          >
            {strings.common.workspaceSidHint}
          </p>
        </fieldset>
        {mode === "batch" && (
          <fieldset
            disabled={!!runningTab}
            className="mb-6 min-w-0 space-y-3"
            aria-describedby="shared-workers-hint"
          >
            <legend className="mb-2 text-sm font-medium">
              {strings.taskrouter.assignWorkers.workersLabel}
            </legend>
            <p
              id="shared-workers-hint"
              className="text-xs text-muted-foreground"
            >
              {labels.workersHint}
            </p>
            {batchWorkers.map((worker, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label htmlFor={`shared-worker-${index}`} className="sr-only">
                  {strings.taskrouter.assignWorkers.workerLabel(index + 1)}
                </Label>
                <StoredInput
                  id={`shared-worker-${index}`}
                  storageKey={STORED_KEYS.workerIdentifiers}
                  environmentId={activeEnvironment?.id}
                  value={worker}
                  disabled={!!runningTab}
                  onChange={(value) =>
                    setWorkers((previous) =>
                      previous.map((item, position) =>
                        position === index ? value : item
                      )
                    )
                  }
                  placeholder={
                    strings.taskrouter.updateWorkerFeature.workersPlaceholder
                  }
                  containerClassName="min-w-0 flex-1"
                />
                <ActionButton
                  action="remove"
                  iconOnly
                  disabled={!!runningTab || batchWorkers.length === 1}
                  aria-label={strings.taskrouter.assignWorkers.removeWorker(
                    index + 1
                  )}
                  onClick={() =>
                    setWorkers((previous) =>
                      previous.filter((_, position) => position !== index)
                    )
                  }
                />
              </div>
            ))}
            <ActionButton
              action="add"
              disabled={!!runningTab || batchWorkers.length >= MAX_ITEMS}
              onClick={() => setWorkers((previous) => [...previous, ""])}
            >
              {strings.taskrouter.assignWorkers.addWorker}
            </ActionButton>
          </fieldset>
        )}
        {mode === "individual" && selectedWorker && tab !== "details" && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-border bg-card px-4 py-3"
          >
            <p className="font-medium break-words">
              {selectedWorker.friendlyName}
            </p>
            <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
              {selectedWorker.sid}
            </p>
          </div>
        )}
        {mode === "individual" && workerLoading && (
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {labels.refreshing}
          </p>
        )}
        <Tabs.Root
          value={activeTab}
          onValueChange={(value) => selectTab(value as WorkerManagementTab)}
        >
          {mode === "batch" && navigation}
          <div hidden={mode === "batch"}>
            <FetchWorkerForm>
              {mode === "individual" && selectedWorker && navigation}
            </FetchWorkerForm>
          </div>
          <Tabs.Content
            value="skills"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            {mode === "individual" && selectedWorker && (
              <WorkerCurrentConfiguration
                worker={selectedWorker}
                section="skills"
              />
            )}
            <AssignWorkersForm key={`skills:${actionKey}`} />
          </Tabs.Content>
          <Tabs.Content
            value="features"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            {mode === "individual" && selectedWorker && (
              <WorkerCurrentConfiguration
                worker={selectedWorker}
                section="features"
              />
            )}
            <UpdateWorkerFeatureForm key={`features:${actionKey}`} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </WorkerManagementProvider>
  )
}
