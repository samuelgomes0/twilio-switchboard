"use client"

import * as React from "react"
import { createLogEntry, type LogEntry } from "@/components/log-output"
import type { UpdateWorkerFeatureInput } from "@/features/taskrouter/types"
import { strings } from "@/lib/strings"

export function useUpdateWorkerFeature() {
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<
    "idle" | "running" | "done" | "error"
  >("idle")
  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  async function run(input: UpdateWorkerFeatureInput) {
    if (abortRef.current) return
    const controller = new AbortController()
    abortRef.current = controller
    setLogs([])
    setStatus("running")
    const addLog = (level: LogEntry["level"], message: string) =>
      setLogs((previous) => [...previous, createLogEntry(level, message)])
    try {
      const response = await fetch("/api/taskrouter/update-worker-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) throw new Error()
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let completed = false
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""
          for (const event of events) {
            const line = event
              .split("\n")
              .find((entry) => entry.startsWith("data:"))
            if (!line) continue
            const payload: unknown = JSON.parse(line.slice(5))
            if (typeof payload !== "object" || payload === null)
              throw new Error()
            const data = payload as Record<string, unknown>
            if (
              (data.level !== "info" &&
                data.level !== "success" &&
                data.level !== "warning" &&
                data.level !== "error") ||
              typeof data.message !== "string"
            )
              throw new Error()
            addLog(data.level, data.message)
            if (data.done === true) {
              completed = true
              setStatus(
                typeof data.totalErrors === "number" && data.totalErrors > 0
                  ? "error"
                  : "done"
              )
            }
          }
        }
        if (!completed) throw new Error()
      } finally {
        reader.releaseLock()
      }
    } catch {
      if (controller.signal.aborted) {
        addLog("warning", strings.taskrouter.updateWorkerFeature.cancelled)
        setStatus("idle")
      } else {
        addLog("error", strings.taskrouter.updateWorkerFeature.connectionError)
        setStatus("error")
      }
    } finally {
      abortRef.current = null
    }
  }

  return { logs, status, run, cancel: () => abortRef.current?.abort() }
}
