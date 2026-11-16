"use client"

import { createLogEntry, type LogEntry } from "@/components/log-output"
import type { UpdateWorkerFeatureInput } from "@/features/taskrouter/types"
import { consumeSseStream } from "@/lib/sse-reader"
import { strings } from "@/lib/strings"
import * as React from "react"

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
      const response = await fetch(
        "/api/taskrouter/set-worker-feature-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        }
      )
      if (!response.ok || !response.body) throw new Error()
      const reader = response.body.getReader()
      await consumeSseStream(reader, (data) => {
          addLog(data.level, data.message)
          if (data.done === true) {
            setStatus(
              typeof data.totalErrors === "number" && data.totalErrors > 0
                ? "error"
                : "done"
            )
          }
      })
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
