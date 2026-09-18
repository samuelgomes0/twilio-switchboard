import { JsonBlock } from "@/components/json-block"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ConversationData } from "@/features/conversations/types"
import { formatConversationDate } from "@/features/conversations/lib/format-conversation-date"
import { strings } from "@/lib/strings"

export function ConversationDetails({
  conversation,
  onRefresh,
}: {
  conversation: ConversationData
  onRefresh: () => void
}) {
  const labels = strings.conversations.consult
  const stateLabel =
    conversation.state === "active"
      ? labels.active
      : conversation.state === "inactive"
        ? labels.inactive
        : conversation.state === "closed"
          ? labels.closed
          : labels.unknownState

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {labels.sidLabel}
          </p>
          <h2 className="rounded-md bg-muted px-3 py-2 font-mono text-sm font-semibold break-all text-foreground">
            {conversation.sid}
          </h2>
          <Badge
            className="mt-2"
            variant={
              conversation.state === "active"
                ? "success"
                : conversation.state === "inactive"
                  ? "warning"
                  : "secondary"
            }
          >
            {stateLabel}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          {labels.refresh}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">
              {strings.conversations.fetch.result.dateCreated}
            </p>
            <p className="text-xs font-medium">
              {formatConversationDate(conversation.dateCreated)}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">
              {strings.conversations.fetch.result.dateUpdated}
            </p>
            <p className="text-xs font-medium">
              {formatConversationDate(conversation.dateUpdated)}
            </p>
          </div>
          {conversation.messagingServiceSid && (
            <div className="col-span-2">
              <p className="mb-0.5 text-xs text-muted-foreground">
                {strings.conversations.fetch.result.messagingServiceSid}
              </p>
              <p className="font-mono text-xs">
                {conversation.messagingServiceSid}
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {strings.conversations.fetch.result.attributes}
          </p>
          <JsonBlock value={conversation.attributes} />
        </div>
      </CardContent>
    </Card>
  )
}
