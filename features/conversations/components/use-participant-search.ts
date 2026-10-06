"use client"

import * as React from "react"
import type {
  ParticipantConversation,
  ParticipantConversationPage,
} from "@/features/conversations/lib/fetch-by-participant"
import {
  searchParticipantPages,
  sortParticipantConversations,
} from "@/features/conversations/lib/search-participant-pages"
import type { CloseConversationResult } from "@/features/conversations/types"
import { strings } from "@/lib/strings"

interface SearchEnvironment {
  id: string
  accountSid: string
  authToken: string
}

export function useParticipantSearch(environment: SearchEnvironment | null) {
  const [results, setResults] = React.useState<
    ParticipantConversation[] | null
  >(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pages, setPages] = React.useState(0)
  const [cancelled, setCancelled] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [])

  async function search(
    phone: string
  ): Promise<ParticipantConversation[] | null> {
    if (!environment || abortRef.current) return null
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setResults(null)
    setError(null)
    setCancelled(false)
    setPages(0)
    try {
      const conversations = await searchParticipantPages(
        async (pageToken) => {
          const response = await fetch("/api/conversations/search-by-number", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: `whatsapp:+55${phone}`,
              pageToken,
              accountSid: environment.accountSid,
              authToken: environment.authToken,
            }),
            signal: controller.signal,
          })
          if (!response.ok) throw new Error("Participant search failed")
          return (await response.json()) as ParticipantConversationPage
        },
        controller.signal,
        (conversations, count) => {
          setResults(conversations)
          setPages(count)
        }
      )
      return abortRef.current === controller && !controller.signal.aborted
        ? conversations
        : null
    } catch {
      if (abortRef.current === controller) {
        if (controller.signal.aborted) setCancelled(true)
        else setError(strings.conversations.fetchByParticipant.searchFailed)
      }
      return null
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  return {
    updateConversation: (result: CloseConversationResult) =>
      setResults((current) =>
        current === null
          ? null
          : sortParticipantConversations(
              current.map((conversation) =>
                conversation.conversationSid === result.sid
                  ? {
                      ...conversation,
                      conversationState: result.state,
                      conversationDateUpdated: result.dateUpdated,
                    }
                  : conversation
              )
            )
      ),
    results,
    loading,
    error,
    pages,
    cancelled,
    search,
    cancel: () => abortRef.current?.abort(),
  }
}
