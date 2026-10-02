"use client"

import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import * as React from "react"

type LogLevel = "info" | "success" | "warning" | "error"

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
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
}

const levelPrefixes: Record<LogLevel, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function LogOutput({
  entries,
  className,
  emptyMessage = strings.common.waitingForOperations,
}: LogOutputProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const region = bottomRef.current?.parentElement
    if (region) region.scrollTop = region.scrollHeight
  }, [entries])

  return (
    <div
      data-slot="log-output"
      role="log"
      aria-label={strings.common.logOfOperations}
      aria-live="polite"
      aria-atomic="false"
      className={cn("execution-log", className)}
    >
      {entries.length === 0 ? (
        <p className="text-muted-foreground select-none">{emptyMessage}</p>
      ) : (
        <div className="space-y-0.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-2 leading-relaxed">
              <span className="shrink-0 text-muted-foreground">
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
              <span
                className={cn(
                  "min-w-0 flex-1 [overflow-wrap:anywhere]",
                  levelStyles[entry.level]
                )}
              >
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
