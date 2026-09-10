"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Tabs } from "radix-ui"
import { Button } from "@/components/ui/button"
import { ConversationDetails } from "./conversation-details"
import { ConversationParticipants } from "./conversation-participants"
import { useConversationQuery } from "./use-conversation-query"
import type { TwilioEnvironment } from "@/features/environments/storage"
import { strings } from "@/lib/strings"
import {
  ConversationDetailsSkeleton,
  ConversationMessagesSkeleton,
} from "./conversation-skeletons"

const ConversationMessages = dynamic(
  () =>
    import("./conversation-messages").then(
      (module) => module.ConversationMessages
    ),
  {
    loading: ConversationMessagesSkeleton,
  }
)

function QueryFeedback({
  error,
  loading,
  retry,
}: {
  error: string | null
  loading: React.ReactNode
  retry: () => void
}) {
  return error ? (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-destructive/30 p-4"
    >
      <p>{error}</p>
      <Button variant="outline" onClick={retry}>
        {strings.conversations.consult.retry}
      </Button>
    </div>
  ) : (
    loading
  )
}

export function ConversationResult({
  sid,
  environment,
  initialTab,
  refresh,
}: {
  sid: string
  environment: TwilioEnvironment
  initialTab: "details" | "messages"
  refresh: (tab: "details" | "messages") => void
}) {
  const [tab, setTab] = React.useState(initialTab)
  const [messagesRequested, setMessagesRequested] = React.useState(
    initialTab === "messages"
  )
  const {
    details,
    detailsError,
    messages,
    messagesError,
    retryDetails,
    retryMessages,
  } = useConversationQuery(sid, environment, messagesRequested)
  const labels = strings.conversations.consult

  return (
    <section className="mt-6 space-y-4" aria-label={labels.result}>
      <Tabs.Root
        value={tab}
        onValueChange={(value) => {
          const next = value === "messages" ? "messages" : "details"
          setTab(next)
          if (next === "messages") setMessagesRequested(true)
        }}
      >
        <Tabs.List
          aria-label={labels.tabs}
          className="mb-4 flex gap-1 rounded-lg bg-muted p-1"
        >
          {(["details", "messages"] as const).map((value) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="flex-1 cursor-pointer rounded-md px-4 py-2 text-sm transition-colors hover:bg-background/60 focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:hover:bg-background/80"
            >
              {labels[value]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          value="details"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          {details ? (
            <>
              <ConversationDetails
                conversation={details.conversation}
                onRefresh={() => refresh("details")}
              />
              <ConversationParticipants participants={details.participants} />
            </>
          ) : (
            <QueryFeedback
              error={detailsError}
              loading={<ConversationDetailsSkeleton />}
              retry={retryDetails}
            />
          )}
        </Tabs.Content>
        <Tabs.Content
          value="messages"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {messagesRequested &&
            (messages ? (
              <ConversationMessages
                data={messages}
                participants={details?.participants ?? []}
              />
            ) : (
              <QueryFeedback
                error={messagesError}
                loading={<ConversationMessagesSkeleton />}
                retry={retryMessages}
              />
            ))}
        </Tabs.Content>
      </Tabs.Root>
    </section>
  )
}
