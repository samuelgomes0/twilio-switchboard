"use client"
import * as React from "react"
import { registerUnsavedChanges } from "@/lib/unsaved-changes"

// Tab memory only: drafts may contain customer data and must not gain disk persistence.
const drafts = new Map<string, unknown>()
export function useOperationDraft<T>(initial: T, scope: string) {
  const [value, updateValue] = React.useState<T>(initial)
  const currentRef = React.useRef(value)
  const fallbackRef = React.useRef(initial)
  React.useEffect(() => {
    fallbackRef.current = initial
  }, [initial])
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      // Each private scope has one value type; no external data enters this map.
      const restored = drafts.has(scope)
        ? (drafts.get(scope) as T)
        : fallbackRef.current
      currentRef.current = restored
      updateValue(restored)
    })
    return () => cancelAnimationFrame(frame)
  }, [scope])
  function setValue(next: React.SetStateAction<T>) {
    const value =
      typeof next === "function"
        ? (next as (previous: T) => T)(currentRef.current)
        : next
    currentRef.current = value
    drafts.delete(scope)
    drafts.set(scope, value)
    const oldest = drafts.keys().next().value
    if (drafts.size > 100 && oldest !== undefined) drafts.delete(oldest)
    updateValue(value)
  }
  return [value, setValue] as const
}

export function useUnsavedChanges(dirty: boolean) {
  React.useEffect(() => (dirty ? registerUnsavedChanges() : undefined), [dirty])
}
