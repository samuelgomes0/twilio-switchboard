import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Participant } from "@/features/conversations/types"
import { formatConversationDate } from "@/features/conversations/lib/format-conversation-date"
import { strings } from "@/lib/strings"

export function ConversationParticipants({
  participants,
}: {
  participants: Participant[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {strings.conversations.fetch.result.participants}{" "}
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {participants.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {strings.conversations.fetch.result.noParticipants}
          </p>
        ) : (
          <div className="space-y-3">
            {participants.map((p, idx) => (
              <div key={p.sid}>
                {idx > 0 && <Separator className="mb-3" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.sid}
                    </span>
                    {p.identity && (
                      <Badge variant="outline" className="text-[10px]">
                        {p.identity}
                      </Badge>
                    )}
                  </div>

                  {p.messagingBinding && (
                    <div className="space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs">
                      {p.messagingBinding.type && (
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 text-muted-foreground">
                            {strings.conversations.fetch.result.type}
                          </span>
                          <span>{p.messagingBinding.type}</span>
                        </div>
                      )}
                      {p.messagingBinding.address && (
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 text-muted-foreground">
                            {strings.conversations.fetch.result.address}
                          </span>
                          <span className="font-mono">
                            {p.messagingBinding.address}
                          </span>
                        </div>
                      )}
                      {p.messagingBinding.proxy_address && (
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 text-muted-foreground">
                            {strings.conversations.fetch.result.proxy}
                          </span>
                          <span className="font-mono">
                            {p.messagingBinding.proxy_address}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        {strings.conversations.fetch.result.added}{" "}
                      </span>
                      {formatConversationDate(p.dateCreated)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {strings.conversations.fetch.result.updated}{" "}
                      </span>
                      {formatConversationDate(p.dateUpdated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
