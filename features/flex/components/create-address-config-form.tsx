"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"
import { Select } from "@/components/ui/select"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { CheckCircle2, Info, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { StoredInput } from "@/components/stored-input"
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
import { Badge } from "@/components/ui/badge"
import { WarningBadge } from "@/components/warning-badge"

import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEnvironment } from "@/features/environments/context"
import type {
  AddressConfigData,
  AddressConfigType,
  AutoCreationType,
} from "@/features/flex/types"
import { MAX_HISTORY } from "@/lib/constants"
import { environmentHistoryKey, pushHistory, readHistory } from "@/lib/operation-history"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

const s = strings.flex.createAddressConfig

const ADDRESS_TYPES: { value: AddressConfigType; label: string }[] = [
  { value: "whatsapp", label: s.addressTypes.whatsapp },
  { value: "sms", label: s.addressTypes.sms },
  { value: "messenger", label: s.addressTypes.messenger },
  { value: "gbm", label: s.addressTypes.gbm },
  { value: "email", label: s.addressTypes.email },
  { value: "rcs", label: s.addressTypes.rcs },
  { value: "apple", label: s.addressTypes.apple },
  { value: "chat", label: s.addressTypes.chat },
]

const INTEGRATION_TYPES: { value: AutoCreationType; label: string }[] = [
  { value: "studio", label: s.integrationTypes.studio },
  { value: "webhook", label: s.integrationTypes.webhook },
  { value: "default", label: s.integrationTypes.default },
]

interface HistoryEntry {
  ts: number
  address: string
  type: string
  sid: string
}

const HISTORY_KEY = "switchboard:create-address-config-history"

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm  transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: string | null): string {
  if (!d) return strings.common.notAvailable
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function CapabilitiesBox({ type }: { type: AddressConfigType }) {
  const raw = s.addressCapabilities[type]
  const parts = raw.split(/\*\*(.+?)\*\*/)
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
      <p className="text-sm text-blue-900 dark:text-blue-200">
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </p>
    </div>
  )
}

export function CreateAddressConfigForm() {
  const { activeEnvironment } = useEnvironment()
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
  const router = useRouter()

  const [addressType, setAddressType] =
    React.useState<AddressConfigType>("whatsapp")
  const [address, setAddress] = React.useState("")
  const [friendlyName, setFriendlyName] = React.useState("")
  const [integrationType, setIntegrationType] =
    React.useState<AutoCreationType>("studio")
  const [studioFlowSid, setStudioFlowSid] = React.useState("")
  const [webhookUrl, setWebhookUrl] = React.useState("")
  const [webhookMethod, setWebhookMethod] = React.useState<"GET" | "POST">(
    "POST"
  )

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<AddressConfigData | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )

  const canSubmit = address.trim().length > 0 && !loading && !!activeEnvironment

  async function runCreate() {
    if (!canSubmit || !activeEnvironment) return

    setLoading(true)
    setError(null)
    setResult(null)
    const controller = new AbortController()
    abortRef.current = controller

    const body: Record<string, unknown> = {
      address: address.trim(),
      type: addressType,
      autoCreationEnabled: true,
      autoCreationType: integrationType,
    }

    if (friendlyName.trim()) body.friendlyName = friendlyName.trim()

    if (integrationType === "studio" && studioFlowSid.trim()) {
      body.autoCreationStudioFlowSid = studioFlowSid.trim()
    }

    if (integrationType === "webhook") {
      if (webhookUrl.trim()) body.autoCreationWebhookUrl = webhookUrl.trim()
      body.autoCreationWebhookMethod = webhookMethod
    }

    body.accountSid = activeEnvironment.accountSid
    body.authToken = activeEnvironment.authToken

    try {
      const res = await fetch("/api/flex/create-conversation-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const json = (await res.json()) as AddressConfigData & { error?: string }
      if (controller.signal.aborted) return

      if (!res.ok || json.error) {
        setError(json.error ?? strings.common.unknown)
        return
      }

      setResult(json)
      const entry: HistoryEntry = {
        ts: Date.now(),
        address: json.address,
        type: json.type,
        sid: json.sid,
      }
      pushHistory(historyKey, entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch {
      if (!controller.signal.aborted) setError(strings.common.networkError)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  function clearHistory() {
    try {
      if (historyKey) localStorage.removeItem(historyKey)
    } catch {}
    setHistory([])
  }

  const formActions = (
    <ActionBar>
      <ActionButton
        action="primary"
        aria-busy={loading}
        type="submit"
        disabled={!canSubmit}
      >
        {loading && (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        )}
        {s.submit}
      </ActionButton>
      <ActionButton
        action="cancel"
        type="button"
        onClick={() => router.push("/flex")}
        disabled={loading}
      >
        {s.cancel}
      </ActionButton>
    </ActionBar>
  )

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={s.title}
        description={s.subtitle}
        parent={{ href: "/flex", label: strings.sidebar.sections.flex }}
        badge={<WarningBadge />}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      {/* Form */}
      <form onSubmit={handleFormSubmit} className="operation-form space-y-5">
        {/* Address type */}
        <div className="space-y-2">
          <Label htmlFor="addressType">
            <span className="mr-0.5 text-destructive">*</span>
            {s.addressTypeLabel}
          </Label>
          <Select
            id="addressType"
            value={addressType}
            onChange={(e) => {
              setAddressType(e.target.value as AddressConfigType)
              setAddress("")
            }}
            disabled={loading}
            className={selectClass}
          >
            {ADDRESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Capabilities info box */}
        <CapabilitiesBox type={addressType} />

        {/* Address / number */}
        <div className="space-y-2">
          <Label htmlFor="address">
            <span className="mr-0.5 text-destructive">*</span>
            {s.addressFieldLabel[addressType]}
          </Label>
          <StoredInput
            id="address"
            storageKey={STORED_KEYS.flexAddresses}
            environmentId={activeEnvironment?.id}
            value={address}
            onChange={setAddress}
            placeholder={
              addressType === "whatsapp" || addressType === "sms"
                ? strings.common.placeholders.phone
                : ""
            }
            disabled={loading}
          />
        </div>

        {/* Friendly name */}
        <div className="space-y-2">
          <Label htmlFor="friendlyName">{s.friendlyNameLabel}</Label>
          <Input
            id="friendlyName"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            disabled={loading}
            maxLength={256}
          />
        </div>

        <Separator />

        {/* Flex integration section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {s.flexIntegrationSection}
            </h2>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={s.flexIntegrationInfo}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground"
                >
                  <Info aria-hidden="true" className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-72">
                {s.flexIntegrationInfo}
              </TooltipContent>
            </TooltipRoot>
          </div>

          {/* Integration type */}
          <div className="space-y-2">
            <Label htmlFor="integrationType">
              <span className="mr-0.5 text-destructive">*</span>
              {s.integrationTypeLabel}
            </Label>
            <InputActions>
              <div className="min-w-0 flex-1">
                <Select
                  id="integrationType"
                  value={integrationType}
                  onChange={(e) =>
                    setIntegrationType(e.target.value as AutoCreationType)
                  }
                  disabled={loading}
                  className={selectClass}
                >
                  {INTEGRATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              {integrationType === "default" && formActions}
            </InputActions>
          </div>

          {/* Studio fields */}
          {integrationType === "studio" && (
            <div className="space-y-2">
              <Label htmlFor="studioFlowSid">
                <span className="mr-0.5 text-destructive">*</span>
                {s.studioFlowLabel}
              </Label>
              <InputActions>
                <div className="min-w-0 flex-1">
                  <StoredInput
                    id="studioFlowSid"
                    storageKey={STORED_KEYS.studioFlowSids}
                    environmentId={activeEnvironment?.id}
                    value={studioFlowSid}
                    onChange={setStudioFlowSid}
                    aria-describedby="studio-flow-hint"
                    placeholder={s.studioFlowPlaceholder}
                    disabled={loading}
                  />
                </div>
                {formActions}
              </InputActions>
              <p
                id="studio-flow-hint"
                className="text-xs text-muted-foreground"
              >
                {s.studioFlowHint}
              </p>
            </div>
          )}

          {/* Webhook fields */}
          {integrationType === "webhook" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">
                  <span className="mr-0.5 text-destructive">*</span>
                  {s.webhookUrlLabel}
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={strings.common.placeholders.webhook}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookMethod">{s.webhookMethodLabel}</Label>
                <InputActions>
                  <div className="min-w-0 flex-1">
                    <Select
                      id="webhookMethod"
                      value={webhookMethod}
                      onChange={(e) =>
                        setWebhookMethod(e.target.value as "GET" | "POST")
                      }
                      disabled={loading}
                      className={selectClass}
                    >
                      <option value="POST">{s.httpMethods.post}</option>
                      <option value="GET">{s.httpMethods.get}</option>
                    </Select>
                  </div>
                  {formActions}
                </InputActions>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{s.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {s.confirmDescription(
                address.trim(),
                activeEnvironment?.name ?? ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runCreate()
              }}
            >
              {s.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <CardTitle className="min-w-0 font-mono text-sm break-all">
                      {result.sid}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    {result.friendlyName ?? s.result.noFriendlyName}
                  </CardDescription>
                </div>
                <Badge variant="outline">{result.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    {s.result.address}
                  </p>
                  <p className="font-mono text-xs font-medium break-all">
                    {result.address}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    {s.result.addressCountry}
                  </p>
                  <p className="text-xs font-medium">
                    {result.addressCountry ?? s.result.noCountry}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    {s.result.dateCreated}
                  </p>
                  <p className="text-xs font-medium">
                    {formatDate(result.dateCreated)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    {s.result.dateUpdated}
                  </p>
                  <p className="text-xs font-medium">
                    {formatDate(result.dateUpdated)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {s.result.autoCreation}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      result.autoCreation?.enabled ? "success" : "secondary"
                    }
                  >
                    {result.autoCreation?.enabled
                      ? s.result.autoCreationEnabled
                      : s.result.autoCreationDisabled}
                  </Badge>
                  {result.autoCreation?.type && (
                    <Badge variant="outline" className="text-xs">
                      {result.autoCreation.type}
                    </Badge>
                  )}
                </div>
                {result.autoCreation?.webhookUrl && (
                  <p className="mt-2 font-mono text-xs break-all text-muted-foreground">
                    {result.autoCreation.webhookUrl}
                  </p>
                )}
                {result.autoCreation?.studioFlowSid && (
                  <p className="mt-2 font-mono text-xs break-all text-muted-foreground">
                    {result.autoCreation.studioFlowSid}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <RecentHistory onClear={clearHistory}>
          {history.map((h, i) => (
            <RecentHistoryItem key={i}>
              <span className="tabular-nums">{fmtTs(h.ts)}</span>
              {" — "}
              <span className="font-mono font-semibold text-foreground">
                {h.address}
              </span>
              <span> — {h.type}</span>
              <span className="font-mono break-all select-text">
                {" — "}
                {h.sid}
              </span>
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
