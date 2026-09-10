"use client"

import { useState } from "react"
import { Check, CircleHelp, Copy } from "lucide-react"
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { strings } from "@/lib/strings"

export function MessageSidButton({ sid }: { sid: string }) {
  const [feedback, setFeedback] = useState("")
  const labels = strings.conversations.history.result

  async function copyMessageSid() {
    try {
      await navigator.clipboard.writeText(sid)
      setFeedback(labels.sidCopied)
    } catch {
      setFeedback(labels.sidCopyError)
    }
  }

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={copyMessageSid}
              aria-label={labels.copyMessageSid(sid)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {feedback === labels.sidCopied ? (
                <Check className="size-3.5" />
              ) : (
                <CircleHelp className="size-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="end"
            className="max-w-[calc(100vw-2rem)]"
          >
            <button
              type="button"
              onClick={copyMessageSid}
              aria-label={labels.copyMessageSid(sid)}
              className="flex items-center gap-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-current"
            >
              <span className="font-mono text-xs break-all select-text">
                {sid}
              </span>
              <Copy className="size-3.5 shrink-0" />
            </button>
            <p className="mt-1 text-xs">{feedback || labels.copySidHint}</p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
      <span role="status" className="sr-only">
        {feedback}
      </span>
    </>
  )
}
