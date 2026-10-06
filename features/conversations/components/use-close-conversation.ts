"use client"

import * as React from "react"
import type { CloseConversationResult } from "@/features/conversations/types"
import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"

export function useCloseConversation(
  sid: string,
  onUpdated: (result: CloseConversationResult) => void
) {
  const { activeEnvironment } = useEnvironment()
  const [closing, setClosing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(
    () => () => {
      abortRef.current?.abort()
      abortRef.current = null
    },
    []
  )

  async function close() {
    if (!activeEnvironment || abortRef.current) return
    const controller = new AbortController()
    abortRef.current = controller
    setClosing(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/conversations/close-by-sid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error()
      const result = (await response.json()) as CloseConversationResult
      if (controller.signal.aborted) return
      setMessage(
        result.closed
          ? strings.conversations.closeSingle.success
          : strings.conversations.closeSingle.notActive
      )
      onUpdated(result)
    } catch {
      if (!controller.signal.aborted)
        setError(strings.conversations.closeSingle.error)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setClosing(false)
      }
    }
  }

  return { close, closing, error, message, enabled: !!activeEnvironment }
}
