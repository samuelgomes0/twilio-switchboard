"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Plus, Settings2, Trash2 } from "lucide-react"
import { LogOutput } from "@/components/log-output"
import { StoredInput } from "@/components/stored-input"
import { WarningBadge } from "@/components/warning-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useEnvironment } from "@/features/environments/context"
import { useUpdateWorkerFeature } from "./use-update-worker-feature"
import { MAX_ITEMS } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
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
    <div className="mx-auto max-w-3xl">
      <nav
        data-worker-page-header
        className="mb-5 flex items-center gap-1 text-sm"
      >
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
        <span className="font-medium text-foreground" aria-current="page">
          {messages.title}
        </span>
      </nav>
      <div data-worker-page-header className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="size-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {messages.title}
            </h1>
            <WarningBadge />
          </div>
          <p className="text-sm text-muted-foreground">{messages.subtitle}</p>
        </div>
      </div>
      {!activeEnvironment && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {strings.common.noEnvironmentSelected.message}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (valid && activeEnvironment && !running) setConfirmOpen(true)
        }}
        className="space-y-5"
      >
        <fieldset disabled={running} className="space-y-5">
          <div data-worker-workspace-field className="space-y-2">
            <Label htmlFor="feature-workspace">{messages.workspaceLabel}</Label>
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
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {messages.workersLabel}
            </legend>
            {workers.map((worker, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label htmlFor={`feature-worker-${index}`} className="sr-only">
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
                  className="flex-1"
                />
                <button
                  type="button"
                  disabled={running || workers.length === 1}
                  onClick={() =>
                    setWorkers((previous) =>
                      previous.filter((_, position) => position !== index)
                    )
                  }
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                  aria-label={messages.removeWorker(index + 1)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={running || workers.length >= MAX_ITEMS}
              onClick={() => setWorkers((previous) => [...previous, ""])}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-3.5" />
              {messages.addWorker}
            </button>
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
          <div className="space-y-2">
            <Label htmlFor="feature-enabled">{messages.enabledLabel}</Label>
            <select
              id="feature-enabled"
              value={String(enabled)}
              onChange={(event) => setEnabled(event.target.value === "true")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="true">{messages.enabled}</option>
              <option value="false">{messages.disabled}</option>
            </select>
          </div>
        </fieldset>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!valid || !activeEnvironment || running}
            aria-label={messages.submit}
          >
            {running ? strings.common.processing : messages.submit}
          </Button>
          {running && (
            <Button type="button" variant="outline" onClick={cancel}>
              {strings.common.cancel}
            </Button>
          )}
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
        <section
          className="mt-6"
          role="log"
          aria-label={strings.common.logOfOperations}
          aria-live="polite"
        >
          <LogOutput entries={logs} />
        </section>
      )}
    </div>
  )
}
