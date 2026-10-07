"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { FileSearch2, Loader2, Search } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { ContactInput } from "@/components/contact-input"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FetchByParticipantResultsSkeleton } from "@/features/conversations/components/fetch-by-participant-skeleton"
import { useParticipantSearch } from "@/features/conversations/components/use-participant-search"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY } from "@/lib/constants"
import { environmentHistoryKey, pushHistory, readHistory } from "@/lib/operation-history"
import { strings } from "@/lib/strings"
import { CloseConversationButton } from "@/features/conversations/components/close-conversation-button"

type StateFilter = "all" | "active" | "inactive" | "closed"

interface HistoryEntry {
  ts: number
  phone: string
  stateFilter: StateFilter
  count: number
}

const HISTORY_KEY = "switchboard:fetch-by-participant-history"
const PHONE_RE = /^\d{10,11}$/

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: Date | null | string): string {
  if (!d) return strings.common.notAvailable
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
  {
    value: "all",
    label: strings.conversations.fetchByParticipant.stateOptions.all,
  },
  {
    value: "active",
    label: strings.conversations.fetchByParticipant.stateOptions.active,
  },
  {
    value: "inactive",
    label: strings.conversations.fetchByParticipant.stateOptions.inactive,
  },
  {
    value: "closed",
    label: strings.conversations.fetchByParticipant.stateOptions.closed,
  },
]

export function FetchByParticipantForm() {
  const { activeEnvironment } = useEnvironment()
  return <ParticipantSearchForm key={activeEnvironment?.id ?? ""} />
}

function ParticipantSearchForm() {
  const { activeEnvironment } = useEnvironment()
  const historyKey = activeEnvironment
    ? environmentHistoryKey(HISTORY_KEY, activeEnvironment.id)
    : ""
  const [phone, setPhone] = React.useState("")
  const [phoneError, setPhoneError] = React.useState<string | null>(null)
  const [stateFilter, setStateFilter] = React.useState<StateFilter>("all")
  const {
    results,
    loading,
    error,
    pages,
    cancelled,
    search,
    cancel,
    updateConversation,
  } = useParticipantSearch(activeEnvironment)
  const [visibleCount, setVisibleCount] = React.useState(20)
  const [history, setHistory] = useBrowserState<HistoryEntry[]>(
    () => (historyKey ? readHistory<HistoryEntry>(historyKey) : []),
    [],
    historyKey
  )
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const canSubmit = phone.trim().length > 0 && !loading && !!activeEnvironment

  const address = `whatsapp:+55${phone.trim()}`

  async function runSearch(
    requestedPhone = phone.trim(),
    requestedStateFilter = stateFilter
  ) {
    if (loading || !activeEnvironment || !PHONE_RE.test(requestedPhone)) return
    setVisibleCount(20)
    const conversations = await search(requestedPhone)
    if (!conversations) return
    const entry: HistoryEntry = {
      ts: Date.now(),
      phone: requestedPhone,
      stateFilter: requestedStateFilter,
      count: conversations.length,
    }
    pushHistory(historyKey, entry)
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (!PHONE_RE.test(phone.trim())) {
      setPhoneError(strings.conversations.fetchByParticipant.invalidPhone)
      return
    }
    setPhoneError(null)
    setConfirmOpen(true)
  }

  function clearHistory() {
    try {
      if (historyKey) localStorage.removeItem(historyKey)
    } catch {}
    setHistory([])
  }

  const filteredResults =
    results === null
      ? null
      : stateFilter === "all"
        ? results
        : results.filter((pc) => pc.conversationState === stateFilter)
  const displayedCount = Math.max(
    visibleCount,
    filteredResults?.filter(
      (conversation) => conversation.conversationState === "active"
    ).length ?? 0
  )
  const loadMoreButton =
    filteredResults && filteredResults.length > displayedCount ? (
      <div className="flex justify-center py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setVisibleCount(displayedCount + 20)}
        >
          {strings.conversations.fetchByParticipant.results.loadMore}
        </Button>
      </div>
    ) : null

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.conversations.fetchByParticipant.title}
        description={strings.conversations.fetchByParticipant.subtitle}
        parent={{
          href: "/conversations",
          label: strings.sidebar.sections.conversations,
        }}
      />

      {/* No environment warning */}
      {!activeEnvironment && <NoEnvironmentSelected />}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="operation-form w-full max-w-3xl space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="phone">
            {strings.conversations.fetchByParticipant.phoneLabel}{" "}
            <span className="font-normal text-muted-foreground">
              {strings.conversations.fetchByParticipant.phoneLabelHint}
            </span>
          </Label>
          <InputActions>
            <ContactInput
              id="phone"
              aria-describedby={
                phoneError ? "participant-phone-error" : undefined
              }
              aria-invalid={!!phoneError}
              value={phone}
              onChange={(v) => {
                setPhone(v)
                if (phoneError) setPhoneError(null)
              }}
              placeholder={strings.common.placeholders.localPhone}
              disabled={loading}
              prefix="whatsapp:+55"
              containerClassName="w-full min-w-0 flex-1"
              className="search-control pl-[7.5rem]"
            />
            <ActionBar>
              <ActionButton
                action="search"
                aria-busy={loading}
                type="submit"
                disabled={!canSubmit}
              >
                {loading ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search className="size-3.5" />
                )}
                {strings.common.search}
              </ActionButton>
            </ActionBar>
          </InputActions>
        </div>

        {phoneError && (
          <p id="participant-phone-error" className="text-xs text-destructive">
            {phoneError}
          </p>
        )}

        {/* State filter */}
        <div className="space-y-2">
          <Label>{strings.conversations.fetchByParticipant.filterLabel}</Label>
          <div className="flex flex-wrap gap-1.5">
            {STATE_OPTIONS.map((opt) => (
              <button
                aria-pressed={stateFilter === opt.value}
                key={opt.value}
                type="button"
                onClick={() => {
                  setStateFilter(opt.value)
                  setVisibleCount(20)
                }}
                disabled={loading}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
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
            <AlertDialogTitle>
              {strings.conversations.fetchByParticipant.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.conversations.fetchByParticipant.confirmDescription(
                address,
                activeEnvironment?.name ?? "",
                stateFilter !== "all" ? stateFilter : undefined
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2"
              onClick={() => {
                setConfirmOpen(false)
                void runSearch()
              }}
            >
              <Search aria-hidden="true" className="size-3.5" />
              {strings.common.search}
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

      {loading && (
        <div className="mt-5 space-y-3">
          <p role="status" className="text-sm text-muted-foreground">
            {strings.conversations.fetchByParticipant.progress(
              pages,
              results?.length ?? 0
            )}
          </p>
          <Button type="button" variant="outline" onClick={cancel}>
            {strings.common.cancel}
          </Button>
        </div>
      )}
      {cancelled && (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          {strings.conversations.fetchByParticipant.cancelled}
        </p>
      )}
      {loading && results === null && (
        <FetchByParticipantResultsSkeleton announce={false} />
      )}

      {/* Results */}
      {filteredResults !== null &&
        !(loading && filteredResults.length === 0) && (
          <div className="mt-6 w-full max-w-3xl">
            {filteredResults.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {results?.length === 0
                    ? strings.conversations.fetchByParticipant.results.none
                    : strings.conversations.fetchByParticipant.results.noneFiltered(
                        stateFilter
                      )}
                </p>
                {loadMoreButton}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {strings.conversations.fetchByParticipant.results.count(
                    filteredResults.length
                  )}
                  {stateFilter !== "all" &&
                    results &&
                    results.length !== filteredResults.length && (
                      <>
                        {strings.conversations.fetchByParticipant.results.totalSuffix(
                          results.length
                        )}
                      </>
                    )}
                </p>
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {filteredResults.slice(0, displayedCount).map((pc) => (
                      <li
                        key={pc.conversationSid}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="font-mono text-sm font-semibold break-all text-foreground">
                              {pc.conversationSid}
                            </h2>
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
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {
                              strings.conversations.fetchByParticipant.results
                                .dateCreated
                            }{" "}
                            {formatDate(pc.conversationDateCreated)}
                          </span>
                          <span>
                            {
                              strings.conversations.fetchByParticipant.results
                                .dateUpdated
                            }{" "}
                            {formatDate(pc.conversationDateUpdated)}
                          </span>
                        </div>
                        {pc.participantIdentity && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              strings.conversations.fetchByParticipant.results
                                .identity
                            }{" "}
                            <span className="font-mono break-all">
                              {pc.participantIdentity}
                            </span>
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button asChild variant="outline" size="xs">
                            <Link
                              href={{
                                pathname: "/conversations/consult-by-sid",
                                query: {
                                  sid: pc.conversationSid,
                                  tab: "details",
                                },
                              }}
                            >
                              <FileSearch2 />
                              {
                                strings.conversations.fetchByParticipant.results
                                  .consultConversation
                              }
                            </Link>
                          </Button>
                          <CloseConversationButton
                            sid={pc.conversationSid}
                            state={pc.conversationState}
                            disabled={loading}
                            onUpdated={updateConversation}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {loadMoreButton}
                </div>
              </div>
            )}
          </div>
        )}

      {/* History */}
      {history.length > 0 && (
        <RecentHistory onClear={clearHistory}>
          {history.map((h, i) => (
            <RecentHistoryItem
              key={i}
              onSelect={() => {
                setPhone(h.phone)
                setStateFilter(h.stateFilter)
                void runSearch(h.phone, h.stateFilter)
              }}
              ariaLabel={strings.common.recentHistory.reuse}
            >
              <span className="tabular-nums">{fmtTs(h.ts)}</span>
              {" — "}
              <span className="font-mono font-semibold text-foreground">
                {h.phone}
              </span>
              {h.stateFilter !== "all" && <span> — {h.stateFilter}</span>}
              {" — "}
              {strings.conversations.fetchByParticipant.history.item(h.count)}
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </div>
  )
}
