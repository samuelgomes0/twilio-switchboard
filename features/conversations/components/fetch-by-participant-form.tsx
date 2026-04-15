"use client"

import * as React from "react"
import Link from "next/link"
import { AtSign, ChevronRight, Loader2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { useEnvironment } from "@/features/environments/context"
import type { ParticipantConversation } from "@/features/conversations/lib/fetch-by-participant"
import { strings } from "@/lib/strings"

type StateFilter = "all" | "active" | "inactive" | "closed"

interface HistoryEntry {
  ts: number
  phone: string
  stateFilter: StateFilter
  count: number
}

const HISTORY_KEY = "switchboard:fetch-by-participant-history"
const MAX_HISTORY = 5

function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function pushHistory(entry: HistoryEntry) {
  try {
    const prev = readHistory()
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY))
    )
  } catch {}
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: Date | null | string): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type StateVariant = "success" | "warning" | "secondary" | "outline"

function stateVariant(state: string): StateVariant {
  if (state === "active") return "success"
  if (state === "inactive") return "warning"
  if (state === "closed") return "secondary"
  return "outline"
}

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: "all", label: strings.conversations.fetchByParticipant.stateOptions.all },
  { value: "active", label: strings.conversations.fetchByParticipant.stateOptions.active },
  { value: "inactive", label: strings.conversations.fetchByParticipant.stateOptions.inactive },
  { value: "closed", label: strings.conversations.fetchByParticipant.stateOptions.closed },
]

export function FetchByParticipantForm() {
  const { activeEnvironment } = useEnvironment()
  const [phone, setPhone] = React.useState("")
  const [stateFilter, setStateFilter] = React.useState<StateFilter>("all")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<
    ParticipantConversation[] | null
  >(null)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit = phone.trim().length > 0 && !loading && !!activeEnvironment

  const address = `whatsapp:+55${phone.trim()}`

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch(
        `/api/conversations/fetch-by-participant?address=${encodeURIComponent(address)}`,
        {
          headers: {
            "x-twilio-account-sid": activeEnvironment.accountSid,
            "x-twilio-auth-token": activeEnvironment.authToken,
          },
        }
      )
      const json = (await res.json()) as {
        conversations: ParticipantConversation[]
        error?: string
      }
      if (!res.ok || json.error) {
        setError(json.error ?? strings.common.unknown)
        return
      }
      setResults(json.conversations)
      const entry: HistoryEntry = {
        ts: Date.now(),
        phone: phone.trim(),
        stateFilter,
        count: json.conversations.length,
      }
      pushHistory(entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.common.networkError)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  function clearHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
    setHistory([])
  }

  const filteredResults =
    results === null
      ? null
      : stateFilter === "all"
        ? results
        : results.filter((pc) => pc.conversationState === stateFilter)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/conversations"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.conversations}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {strings.conversations.fetchByParticipant.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <AtSign className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {strings.conversations.fetchByParticipant.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.conversations.fetchByParticipant.subtitle}
          </p>
        </div>
      </div>

      {/* No environment warning */}
      {!activeEnvironment && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              {strings.common.noEnvironmentSelected.title}
            </p>
            <p className="mt-0.5 text-destructive/80">
              {strings.common.noEnvironmentSelected.message}{" "}
              <Link
                href="/environments"
                className="underline underline-offset-2 hover:text-destructive"
              >
                {strings.common.noEnvironmentSelected.link}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">
            {strings.conversations.fetchByParticipant.phoneLabel}{" "}
            <span className="font-normal text-muted-foreground">
              {strings.conversations.fetchByParticipant.phoneLabelHint}
            </span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                whatsapp:+55
              </span>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1187654321"
                disabled={loading}
                className="pl-[7.5rem] font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <AtSign className="size-3.5" />
              )}
              {strings.common.search}
            </Button>
          </div>
        </div>

        {/* State filter */}
        <div className="space-y-2">
          <Label>{strings.conversations.fetchByParticipant.filterLabel}</Label>
          <div className="flex gap-1.5">
            {STATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStateFilter(opt.value)}
                disabled={loading}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  stateFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{strings.conversations.fetchByParticipant.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Buscar conversas do participante{" "}
              <strong className="font-mono">{address}</strong>
              {stateFilter !== "all" && (
                <>
                  {" "}
                  com estado <strong>{stateFilter}</strong>
                </>
              )}{" "}
              no ambiente <strong>{activeEnvironment?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runSearch()
              }}
            >
              {strings.common.search}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {filteredResults !== null && (
        <div className="mt-6">
          {filteredResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {results?.length === 0
                ? strings.conversations.fetchByParticipant.results.none
                : strings.conversations.fetchByParticipant.results.noneFiltered(stateFilter)}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {strings.conversations.fetchByParticipant.results.count(filteredResults.length)}
                {stateFilter !== "all" &&
                  results &&
                  results.length !== filteredResults.length && (
                    <> · {results.length} total</>
                  )}
              </p>
              <ul className="space-y-2">
                {filteredResults.map((pc) => (
                  <li
                    key={pc.conversationSid}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                          {pc.conversationSid}
                        </p>
                        {pc.conversationFriendlyName && (
                          <p className="mt-0.5 text-sm font-medium">
                            {pc.conversationFriendlyName}
                          </p>
                        )}
                      </div>
                      <Badge variant={stateVariant(pc.conversationState)}>
                        {pc.conversationState}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                      <span>
                        {strings.conversations.fetchByParticipant.results.dateCreated} {formatDate(pc.conversationDateCreated)}
                      </span>
                      <span>
                        {strings.conversations.fetchByParticipant.results.dateUpdated} {formatDate(pc.conversationDateUpdated)}
                      </span>
                    </div>
                    {pc.participantIdentity && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {strings.conversations.fetchByParticipant.results.identity}{" "}
                        <span className="font-mono">
                          {pc.participantIdentity}
                        </span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {strings.conversations.fetchByParticipant.history.title}
            </p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {strings.conversations.fetchByParticipant.history.clear}
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                <span className="font-mono">{h.phone}</span>
                {h.stateFilter !== "all" && <span> · {h.stateFilter}</span>}
                {" · "}
                {h.count} conversa(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
