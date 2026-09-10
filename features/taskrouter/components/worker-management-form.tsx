"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"
import { Tabs } from "radix-ui"

import { StoredInput } from "@/components/stored-input"
import { WarningBadge } from "@/components/warning-badge"
import { Label } from "@/components/ui/label"
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
      <div className="mx-auto max-w-3xl">
        <nav className="mb-5 flex items-center gap-1 text-sm">
          <Link
            href="/taskrouter"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {strings.sidebar.sections.taskrouter}
          </Link>
          <ChevronRight
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="font-medium" aria-current="page">
            {labels.title}
          </span>
        </nav>
        <header className="mb-6 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {labels.title}
              </h1>
              {tab !== "details" && <WarningBadge />}
            </div>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </header>
        <div className="mb-5 space-y-2">
          <Label htmlFor="worker-management-workspace">
            {labels.workspaceLabel}
          </Label>
          <StoredInput
            id="worker-management-workspace"
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
          <Tabs.List
            aria-label={labels.tabsLabel}
            className="mb-5 flex gap-1 rounded-lg bg-muted p-1"
          >
            {(["details", "skills", "features"] as const).map((value) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="flex-1 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-background/60 focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
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
