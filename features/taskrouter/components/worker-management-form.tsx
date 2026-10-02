"use client"

import { PageHeader } from "@/components/page-header"

import { Tabs } from "radix-ui"
import * as React from "react"

import { StoredInput } from "@/components/stored-input"
import { Label } from "@/components/ui/label"
import { WarningBadge } from "@/components/warning-badge"
import { useEnvironment } from "@/features/environments/context"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { AssignWorkersForm } from "./assign-workers-form"
import { FetchWorkerForm } from "./fetch-worker-form"
import { UpdateWorkerFeatureForm } from "./update-worker-feature-form"
import {
  WorkerManagementProvider,
  type WorkerManagementTab,
} from "./worker-management-context"

export function WorkerManagementForm({
  initialTab = "details",
}: {
  initialTab?: WorkerManagementTab
}) {
  const labels = strings.taskrouter.workerManagement
  const { activeEnvironment } = useEnvironment()
  const [tab, setTab] = React.useState<WorkerManagementTab>(initialTab)
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [selectedWorkerSid, setSelectedWorkerSid] = React.useState("")

  function selectTab(nextTab: WorkerManagementTab) {
    setTab(nextTab)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", nextTab)
    window.history.replaceState(null, "", url)
  }

  return (
    <WorkerManagementProvider
      value={{
        workspaceSid,
        setWorkspaceSid,
        selectedWorkerSid,
        openWorkerAction(nextTab, sid) {
          setSelectedWorkerSid(sid)
          selectTab(nextTab)
        },
      }}
    >
      <div className="workspace-page">
        <PageHeader
          title={labels.title}
          description={labels.subtitle}
          parent={{
            href: "/taskrouter",
            label: strings.sidebar.sections.taskrouter,
          }}
          badge={tab !== "details" && <WarningBadge />}
        />
        <div className="worker-context mb-6 space-y-2">
          <Label htmlFor="worker-management-workspace">
            {labels.workspaceLabel}
          </Label>
          <StoredInput
            id="worker-management-workspace"
            className="search-control"
            storageKey={STORED_KEYS.workspaceSids}
            environmentId={activeEnvironment?.id}
            value={workspaceSid}
            onChange={setWorkspaceSid}
            placeholder={labels.workspacePlaceholder}
          />
        </div>
        <Tabs.Root
          value={tab}
          onValueChange={(value) => selectTab(value as WorkerManagementTab)}
        >
          <Tabs.List aria-label={labels.tabsLabel} className="tab-list">
            {(["details", "skills", "features"] as const).map((value) => (
              <Tabs.Trigger key={value} value={value} className="tab-trigger">
                {labels.tabs[value]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content
            value="details"
            forceMount
            className="data-[state=inactive]:hidden [&_[data-worker-page-header]]:hidden [&_[data-worker-workspace-field]]:hidden"
          >
            <FetchWorkerForm />
          </Tabs.Content>
          <Tabs.Content
            value="skills"
            forceMount
            className="data-[state=inactive]:hidden [&_[data-worker-page-header]]:hidden [&_[data-worker-workspace-field]]:hidden"
          >
            <AssignWorkersForm key={`skills-${selectedWorkerSid}`} />
          </Tabs.Content>
          <Tabs.Content
            value="features"
            forceMount
            className="data-[state=inactive]:hidden [&_[data-worker-page-header]]:hidden [&_[data-worker-workspace-field]]:hidden"
          >
            <UpdateWorkerFeatureForm key={`features-${selectedWorkerSid}`} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </WorkerManagementProvider>
  )
}
