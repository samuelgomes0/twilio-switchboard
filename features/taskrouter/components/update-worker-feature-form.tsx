"use client"

import { PageHeader } from "@/components/page-header"
import { Select } from "@/components/ui/select"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { LogOutput } from "@/components/log-output"
import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { StoredInput } from "@/components/stored-input"
import { WarningBadge } from "@/components/warning-badge"
import { Loader2, Play } from "lucide-react"
import * as React from "react"

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
import { useEnvironment } from "@/features/environments/context"
import { MAX_ITEMS } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { useUpdateWorkerFeature } from "./use-update-worker-feature"
import { useWorkerManagement } from "./worker-management-context"

export function UpdateWorkerFeatureForm() {
  const management = useWorkerManagement()
  const messages = strings.taskrouter.updateWorkerFeature
  const { activeEnvironment } = useEnvironment()
  const [localWorkspaceSid, setLocalWorkspaceSid] = React.useState("")
  const workspaceSid = management?.workspaceSid ?? localWorkspaceSid
  const setWorkspaceSid = management?.setWorkspaceSid ?? setLocalWorkspaceSid
  const [workers, setWorkers] = React.useState<string[]>([
    management?.selectedWorkerSid ?? "",
  ])
  const [feature, setFeature] = React.useState("")
  const [enabled, setEnabled] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { logs, status, run, cancel } = useUpdateWorkerFeature()
  const workerIdentifiers = [
    ...new Set(workers.map((sid) => sid.trim()).filter(Boolean)),
  ]
  const running = status === "running"
  const valid =
    /^WS[0-9a-f]{32}$/i.test(workspaceSid.trim()) &&
    workerIdentifiers.length > 0 &&
    workerIdentifiers.length <= MAX_ITEMS &&
    workerIdentifiers.every(
      (identifier) =>
        /^WK[0-9a-f]{32}$/i.test(identifier) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    ) &&
    /^[a-zA-Z][a-zA-Z0-9_]{0,99}$/.test(feature.trim()) &&
    !["constructor", "prototype", "__proto__"].includes(feature.trim())

  return (
    <div className="workspace-page">
      {!management && (
        <PageHeader
          title={messages.title}
          description={messages.subtitle}
          parent={{
            href: "/taskrouter",
            label: strings.sidebar.sections.taskrouter,
          }}
          badge={<WarningBadge />}
          embedded
        />
      )}
      {!activeEnvironment && <NoEnvironmentSelected />}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (valid && activeEnvironment && !running) setConfirmOpen(true)
        }}
        className="space-y-5"
      >
        <fieldset disabled={running} className="operation-form space-y-5">
          {!management && (
            <div data-worker-workspace-field className="space-y-2">
              <Label htmlFor="feature-workspace">
                {messages.workspaceLabel}
              </Label>
              <StoredInput
                id="feature-workspace"
                storageKey={STORED_KEYS.workspaceSids}
                environmentId={activeEnvironment?.id}
                value={workspaceSid}
                onChange={setWorkspaceSid}
                disabled={running}
                placeholder={messages.workspacePlaceholder}
              />
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {messages.workersLabel}
            </legend>
            <InputActions>
              <div className="min-w-0 flex-1 space-y-2">
                {workers.map((worker, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label
                      htmlFor={`feature-worker-${index}`}
                      className="sr-only"
                    >
                      {messages.workerLabel(index + 1)}
                    </Label>
                    <Input
                      id={`feature-worker-${index}`}
                      value={worker}
                      onChange={(event) =>
                        setWorkers((previous) =>
                          previous.map((sid, position) =>
                            position === index ? event.target.value : sid
                          )
                        )
                      }
                      placeholder={messages.workersPlaceholder}
                      className="min-w-0 flex-1"
                    />
                    <ActionButton
                      action="remove"
                      iconOnly
                      type="button"
                      disabled={running || workers.length === 1}
                      onClick={() =>
                        setWorkers((previous) =>
                          previous.filter((_, position) => position !== index)
                        )
                      }
                      aria-label={messages.removeWorker(index + 1)}
                    ></ActionButton>
                  </div>
                ))}
              </div>
              <ActionBar>
                <ActionButton
                  action="add"
                  type="button"
                  disabled={running || workers.length >= MAX_ITEMS}
                  onClick={() => setWorkers((previous) => [...previous, ""])}
                >
                  {messages.addWorker}
                </ActionButton>
              </ActionBar>
            </InputActions>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="feature-name">{messages.featureLabel}</Label>
            <Input
              id="feature-name"
              value={feature}
              onChange={(event) => setFeature(event.target.value)}
              placeholder={messages.featurePlaceholder}
              maxLength={100}
              aria-describedby="feature-name-hint"
            />
            <p id="feature-name-hint" className="text-xs text-muted-foreground">
              {messages.featureHint}
            </p>
          </div>
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="feature-enabled">{messages.enabledLabel}</Label>
          <InputActions>
            <div className="min-w-0 flex-1">
              <Select
                disabled={running}
                id="feature-enabled"
                value={String(enabled)}
                onChange={(event) => setEnabled(event.target.value === "true")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="true">{messages.enabled}</option>
                <option value="false">{messages.disabled}</option>
              </Select>
            </div>
            <ActionBar>
              <ActionButton
                action="primary"
                aria-busy={running}
                type="submit"
                disabled={!valid || !activeEnvironment || running}
                aria-label={messages.submit}
              >
                {running ? (
                  <>
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    {strings.common.processing}
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" aria-hidden="true" />
                    {messages.submit}
                  </>
                )}
              </ActionButton>
              {running && (
                <ActionButton action="stop" type="button" onClick={cancel}>
                  {strings.common.cancel}
                </ActionButton>
              )}
            </ActionBar>
          </InputActions>
        </div>
      </form>
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messages.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {messages.confirmDescription(
                feature.trim(),
                enabled,
                workerIdentifiers.length,
                workspaceSid.trim(),
                activeEnvironment?.name ?? ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!valid || !activeEnvironment || running}
              onClick={() => {
                if (!activeEnvironment || !valid) return
                void run({
                  workspaceSid: workspaceSid.trim(),
                  workerSids: workerIdentifiers,
                  feature: feature.trim(),
                  enabled,
                  accountSid: activeEnvironment.accountSid,
                  authToken: activeEnvironment.authToken,
                })
              }}
            >
              {messages.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>
      {logs.length > 0 && (
        <section className="mt-5 space-y-2">
          <p className="text-xs font-medium tracking-normal text-muted-foreground">
            {strings.common.logOfOperations}
          </p>
          <LogOutput entries={logs} />
        </section>
      )}
    </div>
  )
}
