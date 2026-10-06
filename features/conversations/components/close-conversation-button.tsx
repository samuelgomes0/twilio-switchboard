"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { ActionButton } from "@/components/action-button"
import { WarningBadge } from "@/components/warning-badge"
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import type { CloseConversationResult } from "@/features/conversations/types"
import { useCloseConversation } from "@/features/conversations/components/use-close-conversation"
import { strings } from "@/lib/strings"

export function CloseConversationButton({
  sid,
  state,
  disabled = false,
  onUpdated,
}: {
  sid: string
  state: string
  disabled?: boolean
  onUpdated: (result: CloseConversationResult) => void
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { close, closing, error, message, enabled } = useCloseConversation(
    sid,
    onUpdated
  )
  const labels = strings.conversations.closeSingle
  if (state !== "active" && !error && !message) return null
  return (
    <div className="space-y-2">
      {state === "active" && (
        <ActionButton
          action="destructive"
          aria-label={labels.ariaLabel(sid)}
          aria-busy={closing}
          disabled={disabled || closing || !enabled}
          onClick={() => setConfirmOpen(true)}
        >
          {closing && <Loader2 className="animate-spin" aria-hidden="true" />}
          {closing ? labels.closing : labels.button}
        </ActionButton>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
      <AlertDialogRoot
        open={confirmOpen && state === "active"}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmTitle}</AlertDialogTitle>
            <WarningBadge />
            <AlertDialogDescription>
              {labels.confirmDescription(sid)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={disabled || closing || !enabled || state !== "active"}
              onClick={() => {
                setConfirmOpen(false)
                void close()
              }}
            >
              {labels.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>
    </div>
  )
}
