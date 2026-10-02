"use client"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"
import { RecentHistory, RecentHistoryItem } from "@/components/recent-history"
import { StoredInput } from "@/components/stored-input"
import { Search } from "lucide-react"
import * as React from "react"

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
      <form onSubmit={searchConversation} className="operation-form space-y-5">
        <div className="space-y-2">
          <Label htmlFor="conversation-sid">
            {strings.conversations.history.sidLabel}
          </Label>
          <InputActions>
            <StoredInput
              id="conversation-sid"
              className="search-control"
              aria-describedby="conversation-sid-feedback"
              aria-invalid={!!sid.trim() && !valid}
              storageKey={STORED_KEYS.conversationSids}
              environmentId={environment.id}
              value={sid}
              onChange={setSid}
              placeholder={strings.conversations.history.sidPlaceholder}
              containerClassName="w-full min-w-0 flex-1"
            />
            <ActionBar>
              <ActionButton action="search" type="submit" disabled={!valid}>
                <Search aria-hidden="true" className="size-3.5" />
                {strings.common.search}
              </ActionButton>
            </ActionBar>
          </InputActions>
          <p
            id="conversation-sid-feedback"
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
        </div>
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
    <div className="workspace-page">
      <PageHeader
        title={labels.title}
        description={labels.subtitle}
        parent={{
          href: "/conversations",
          label: strings.sidebar.sections.conversations,
        }}
      />
      {activeEnvironment ? (
        <EnvironmentConversationForm
          key={activeEnvironment.id}
          {...props}
          environment={activeEnvironment}
        />
      ) : (
        <NoEnvironmentSelected className="mb-0" />
      )}
    </div>
  )
}
