"use client"

import { MAX_HISTORY } from "@/lib/constants"
import {
  readStorageJson,
  readStorageValue,
  writeStorageJson,
} from "@/lib/browser-storage"
import * as React from "react"

interface HistoryEntry {
  sid: string
  timestamp: number
}
const SID_PATTERN = /^CH[a-f0-9]{32}$/i

function readHistory(key: string): HistoryEntry[] {
  const value = readStorageJson<unknown[]>(key, Array.isArray, [])
  return value
    .filter(
      (entry): entry is HistoryEntry => {
        if (typeof entry !== "object" || entry === null) return false
        const candidate = entry as Record<string, unknown>
        return (
          typeof candidate.sid === "string" &&
          SID_PATTERN.test(candidate.sid) &&
          typeof candidate.timestamp === "number" &&
          Number.isFinite(candidate.timestamp)
        )
      }
    )
    .slice(0, MAX_HISTORY)
}

export function useConversationHistory(environmentId: string) {
  const storageKey = `switchboard:conversation-consult-history:${environmentId}`
  const [history, setHistory] = React.useState(() => {
    // Legacy details history has no environment, so it cannot be safely attributed.
    return readStorageValue(storageKey) !== null
      ? readHistory(storageKey)
      : readHistory(`switchboard:conversation-message-history:${environmentId}`)
  })

  function remember(sid: string) {
    const next = [
      { sid, timestamp: Date.now() },
      ...history.filter((entry) => entry.sid !== sid),
    ].slice(0, MAX_HISTORY)
    setHistory(next)
    writeStorageJson(storageKey, next)
  }

  function clearHistory() {
    setHistory([])
    writeStorageJson(storageKey, [])
  }

  return { history, remember, clearHistory }
}
