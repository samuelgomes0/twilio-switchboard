"use client"

import * as React from "react"
import type {
  FetchResponse,
  ConversationHistoryResponse,
} from "@/features/conversations/types"
import type { TwilioEnvironment } from "@/features/environments/storage"
import { strings } from "@/lib/strings"

// The parent remounts this query when the SID, environment or refresh changes.
export function useConversationQuery(
  sid: string,
  environment: TwilioEnvironment,
  messagesRequested: boolean
) {
  const { accountSid, authToken } = environment
  const [details, setDetails] = React.useState<FetchResponse | null>(null)
  const [detailsError, setDetailsError] = React.useState<string | null>(null)
  const [messages, setMessages] =
    React.useState<ConversationHistoryResponse | null>(null)
  const [messagesError, setMessagesError] = React.useState<string | null>(null)
  const [detailsAttempt, retryDetails] = React.useReducer(
    (value: number) => value + 1,
    0
  )
  const [messagesAttempt, retryMessages] = React.useReducer(
    (value: number) => value + 1,
    0
  )

  React.useEffect(() => {
    const controller = new AbortController()
    async function loadDetails() {
      setDetailsError(null)
      try {
        const response = await fetch("/api/conversations/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sid, accountSid, authToken }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error()
        const result = (await response.json()) as FetchResponse
        if (!controller.signal.aborted) setDetails(result)
      } catch {
        if (!controller.signal.aborted)
          setDetailsError(strings.conversations.consult.detailsError)
      }
    }
    void loadDetails()
    return () => controller.abort()
  }, [sid, accountSid, authToken, detailsAttempt])

  React.useEffect(() => {
    if (!messagesRequested) return
    const controller = new AbortController()
    async function loadMessages() {
      setMessagesError(null)
      try {
        const response = await fetch("/api/conversations/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sid, accountSid, authToken }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error()
        const result = (await response.json()) as ConversationHistoryResponse
        if (!controller.signal.aborted) setMessages(result)
      } catch {
        if (!controller.signal.aborted)
          setMessagesError(strings.conversations.consult.messagesError)
      }
    }
    void loadMessages()
    return () => controller.abort()
  }, [sid, accountSid, authToken, messagesRequested, messagesAttempt])

  return {
    details,
    detailsError,
    messages,
    messagesError,
    retryDetails,
    retryMessages,
  }
}
