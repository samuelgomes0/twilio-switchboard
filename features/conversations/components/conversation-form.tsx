"use client"

import * as React from "react"
import { ChevronRight, FileSearch2, Search } from "lucide-react"
import Link from "next/link"
import { StoredInput } from "@/components/stored-input"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import type { TwilioEnvironment } from "@/features/environments/storage"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { ConversationResult } from "./conversation-result"
import { useConversationHistory } from "./use-conversation-history"

interface ConversationFormProps {
  initialSid?: string
  initialTab?: "details" | "messages"
}

function EnvironmentConversationForm({
  environment,
  initialSid = "",
  initialTab = "details",
}: ConversationFormProps & { environment: TwilioEnvironment }) {
  const normalizedInitialSid = initialSid.trim()
  const initialSidIsValid = /^CH[a-f0-9]{32}$/i.test(normalizedInitialSid)
  const [sid, setSid] = React.useState(normalizedInitialSid)
  const [query, setQuery] = React.useState<{
    sid: string
    tab: "details" | "messages"
    revision: number
  } | null>(() =>
    initialSidIsValid
      ? { sid: normalizedInitialSid, tab: initialTab, revision: 0 }
      : null
  )
  const { history, remember, clearHistory } = useConversationHistory(
    environment.id
  )
  const valid = /^CH[a-f0-9]{32}$/i.test(sid.trim())
  function searchConversation(event: React.FormEvent) {
    event.preventDefault()
    if (!valid) return
    const submittedSid = sid.trim()
    setQuery((previous) => ({
      sid: submittedSid,
      tab: initialTab,
      revision: (previous?.revision ?? 0) + 1,
    }))
    remember(submittedSid)
  }

  function repeatSearch(historySid: string) {
    setSid(historySid)
    setQuery((previous) => ({
      sid: historySid,
      tab: initialTab,
      revision: (previous?.revision ?? 0) + 1,
    }))
    remember(historySid)
  }

  return (
    <>
      <form onSubmit={searchConversation} className="space-y-2">
        <Label htmlFor="conversation-sid">
          {strings.conversations.history.sidLabel}
        </Label>
        <div className="flex gap-2">
          <StoredInput
            id="conversation-sid"
            storageKey={STORED_KEYS.conversationSids}
            environmentId={environment.id}
            value={sid}
            onChange={setSid}
            placeholder={strings.conversations.history.sidPlaceholder}
            containerClassName="flex-1"
          />
          <Button type="submit" disabled={!valid} className="gap-2">
            <Search aria-hidden="true" className="size-3.5" />
            {strings.common.search}
          </Button>
        </div>
        <p
          className={
            sid.trim() && !valid
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {sid.trim() && !valid
            ? strings.conversations.history.sidInvalid
            : strings.conversations.history.sidHint}
        </p>
      </form>
      {query && (
        <ConversationResult
          key={`${query.sid}:${query.revision}`}
          sid={query.sid}
          environment={environment}
          initialTab={query.tab}
          refresh={(tab) =>
            setQuery({ ...query, tab, revision: query.revision + 1 })
          }
        />
      )}
      {history.length > 0 && (
        <RecentHistory onClear={clearHistory}>
          {history.map((entry) => (
            <RecentHistoryItem
              key={entry.sid}
              onSelect={() => repeatSearch(entry.sid)}
              ariaLabel={strings.common.recentHistory.reuse}
            >
              <span className="text-muted-foreground tabular-nums">
                {new Date(entry.timestamp).toLocaleString("pt-BR")}
              </span>
              {" — "}
              <span className="font-mono text-xs font-semibold break-all text-foreground">
                {entry.sid}
              </span>
            </RecentHistoryItem>
          ))}
        </RecentHistory>
      )}
    </>
  )
}

export function ConversationForm(props: ConversationFormProps) {
  const { activeEnvironment } = useEnvironment()
  const labels = strings.conversations.consult
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="/conversations"
        >
          {strings.sidebar.sections.conversations}
        </Link>
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
        />
        <span aria-current="page" className="font-medium text-foreground">
          {labels.title}
        </span>
      </nav>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileSearch2 aria-hidden="true" className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      </div>
      {activeEnvironment ? (
        <EnvironmentConversationForm
          key={activeEnvironment.id}
          {...props}
          environment={activeEnvironment}
        />
      ) : (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-sm"
        >
          <p>{strings.common.noEnvironmentSelected.title}</p>
          <p>
            {strings.common.noEnvironmentSelected.message}{" "}
            <Link className="underline" href="/settings/environments">
              {strings.common.noEnvironmentSelected.link}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
