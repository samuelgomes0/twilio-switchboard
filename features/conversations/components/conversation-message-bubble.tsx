import type { ConversationMessage } from "@/features/conversations/types"
import { formatConversationDate } from "@/features/conversations/lib/format-conversation-date"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { MessageSidButton } from "./message-sid-button"

function formatFileSize(size: number | null): string | null {
  if (size === null) return null
  return new Intl.NumberFormat("pt-BR", {
    style: "unit",
    unit: "kilobyte",
    maximumFractionDigits: 1,
  }).format(size / 1024)
}

export function ConversationMessageBubble({
  message,
  isCustomer,
}: {
  message: ConversationMessage
  isCustomer: boolean
}) {
  const labels = strings.conversations.history.result
  return (
    <li className={cn("flex", isCustomer ? "justify-end" : "justify-start")}>
      <article
        className={cn(
          "max-w-[90%] min-w-0 space-y-2 rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[80%]",
          isCustomer
            ? "rounded-br-sm border-primary/20 bg-primary/10"
            : "rounded-bl-sm border-border bg-background"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1 text-xs leading-6 break-all text-muted-foreground">
            {message.author || labels.systemAuthor}
          </span>
          <MessageSidButton sid={message.sid} />
        </div>
        {message.body ? (
          <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
            {message.body}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {labels.noText}
          </p>
        )}
        {message.media.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-muted/50 px-3 py-2">
            {message.media.map((media, index) => (
              <li
                key={media.sid ?? `${message.sid}-${index}`}
                className="text-xs [overflow-wrap:anywhere] text-muted-foreground"
              >
                {media.filename ?? labels.attachment}
                {media.contentType ? ` · ${media.contentType}` : ""}
                {media.size !== null ? ` · ${formatFileSize(media.size)}` : ""}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end text-[10px] text-muted-foreground">
          <time
            dateTime={
              message.dateCreated
                ? new Date(message.dateCreated).toISOString()
                : undefined
            }
          >
            {formatConversationDate(message.dateCreated)}
          </time>
        </div>
      </article>
    </li>
  )
}
