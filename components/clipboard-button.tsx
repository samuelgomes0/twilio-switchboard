"use client"

import { ActionButton } from "@/components/action-button"
import { strings } from "@/lib/strings"
import { Check, Copy } from "lucide-react"
import * as React from "react"

export function ClipboardButton({
  value,
  label,
  copiedLabel,
}: {
  value: string
  label: string
  copiedLabel: string
}) {
  const [feedback, setFeedback] = React.useState<"idle" | "copied" | "error">(
    "idle"
  )
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback("copied")
    } catch {
      setFeedback("error")
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setFeedback("idle"), 2000)
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <ActionButton
        action="copy"
        type="button"
        onClick={copyValue}
        title={label}
      >
        {feedback === "copied" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        {feedback === "copied" ? copiedLabel : label}
      </ActionButton>
      <span
        role="status"
        className={
          feedback === "error" ? "text-xs text-destructive" : "sr-only"
        }
      >
        {feedback === "error"
          ? strings.interface.copyFailed
          : feedback === "copied"
            ? copiedLabel
            : ""}
      </span>
    </span>
  )
}
