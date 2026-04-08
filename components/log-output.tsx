"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

export type LogLevel = "info" | "success" | "warning" | "error"

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
}

interface LogOutputProps {
  entries: LogEntry[]
  className?: string
  emptyMessage?: string
}

const levelStyles: Record<LogLevel, string> = {
  info: "text-sky-400",
  success: "text-emerald-400",
  warning: "text-yellow-400",
  error: "text-red-400",
}

const levelPrefixes: Record<LogLevel, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function LogOutput({
  entries,
  className,
  emptyMessage = "Waiting for operations...",
}: LogOutputProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  return (
    <div
      data-slot="log-output"
      className={cn(
        "relative max-h-[480px] min-h-[200px] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs",
        className
      )}
    >
      {entries.length === 0 ? (
        <p className="text-zinc-600 select-none">{emptyMessage}</p>
      ) : (
        <div className="space-y-0.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-2 leading-relaxed">
              <span className="shrink-0 text-zinc-600">
                {formatTime(entry.timestamp)}
              </span>
              <span
                className={cn(
                  "w-3 shrink-0 text-center",
                  levelStyles[entry.level]
                )}
              >
                {levelPrefixes[entry.level]}
              </span>
              <span className={cn(levelStyles[entry.level])}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function createLogEntry(level: LogLevel, message: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    message,
    timestamp: new Date(),
  }
}

export { createLogEntry, LogOutput }
