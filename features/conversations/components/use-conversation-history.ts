"use client"

import * as React from "react"
import { MAX_HISTORY } from "@/lib/constants"

interface HistoryEntry {
  sid: string
  timestamp: number
}
const SID_PATTERN = /^CH[a-f0-9]{32}$/i

function readHistory(key: string): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]")
    if (!Array.isArray(value)) return []
    return value
      .filter(
        (entry): entry is HistoryEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof entry.sid === "string" &&
          SID_PATTERN.test(entry.sid) &&
          typeof entry.timestamp === "number" &&
          Number.isFinite(entry.timestamp)
      )
      .slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

export function useConversationHistory(environmentId: string) {
  const storageKey = `switchboard:conversation-consult-history:${environmentId}`
  const [history, setHistory] = React.useState(() => {
    // Legacy details history has no environment, so it cannot be safely attributed.
    try {
      return localStorage.getItem(storageKey) !== null
        ? readHistory(storageKey)
        : readHistory(
            `switchboard:conversation-message-history:${environmentId}`
          )
    } catch {
      return []
    }
  })

  function remember(sid: string) {
    const next = [
      { sid, timestamp: Date.now() },
      ...history.filter((entry) => entry.sid !== sid),
    ].slice(0, MAX_HISTORY)
    setHistory(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {}
  }

  function clearHistory() {
    setHistory([])
    try {
      localStorage.setItem(storageKey, "[]")
    } catch {}
  }

  return { history, remember, clearHistory }
}
