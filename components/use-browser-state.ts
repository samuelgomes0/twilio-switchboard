"use client"

import * as React from "react"

// Keep SSR and the first browser render identical before reading browser storage.
export function useBrowserState<T>(read: () => T, fallback: T, scope = "") {
  const [state, setState] = React.useState<T>(fallback)
  const readRef = React.useRef(read)
  React.useEffect(() => {
    readRef.current = read
  }, [read])
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setState(readRef.current()))
    return () => cancelAnimationFrame(frame)
  }, [scope])
  return [state, setState] as const
}
