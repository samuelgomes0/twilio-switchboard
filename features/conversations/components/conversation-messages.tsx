"use client"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConversationMessageBubble } from "./conversation-message-bubble"
import { isCustomerMessage } from "@/features/conversations/lib/is-customer-message"
import type {
  ConversationHistoryResponse,
  Participant,
} from "@/features/conversations/types"
import { exportMessages } from "@/features/conversations/lib/export-messages"
import { useMessageFilters } from "./use-message-filters"

import { strings } from "@/lib/strings"

export function ConversationMessages({
  data,
  participants,
}: {
  data: ConversationHistoryResponse
  participants: Participant[]
}) {
  const {
    contentQuery,
    setContentQuery,
    authorFilter,
    setAuthorFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    authors,
    filteredMessages,
    hasActiveFilters,
    clearFilters,
  } = useMessageFilters(data.messages)
  return (
    <Card className="p-6">
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {strings.conversations.history.result.filteredMessageCount(
          filteredMessages.length,
          data.messages.length
        )}
      </p>
      {data.hasMore && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {strings.conversations.history.result.limitWarning}
        </p>
      )}
      {data.messages.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message-content-search">
                {strings.conversations.history.filters.contentLabel}
              </Label>
              <Input
                id="message-content-search"
                type="search"
                value={contentQuery}
                onChange={(event) => setContentQuery(event.target.value)}
                placeholder={
                  strings.conversations.history.filters.contentPlaceholder
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message-author-filter">
                {strings.conversations.history.filters.authorLabel}
              </Label>
              <select
                id="message-author-filter"
                value={authorFilter}
                onChange={(event) => setAuthorFilter(event.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <option value="">
                  {strings.conversations.history.filters.allAuthors}
                </option>
                {authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message-start-date">
                {strings.conversations.history.filters.startDateLabel}
              </Label>
              <Input
                id="message-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message-end-date">
                {strings.conversations.history.filters.endDateLabel}
              </Label>
              <Input
                id="message-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X />
                {strings.conversations.history.filters.clear}
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {strings.conversations.history.result.messagesHeading}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={filteredMessages.length === 0}
          onClick={() =>
            exportMessages(data.conversation.sid, filteredMessages)
          }
        >
          <Download />
          {strings.conversations.history.export.button}
        </Button>
      </div>
      {data.messages.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {strings.conversations.history.result.empty}
        </p>
      ) : filteredMessages.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {strings.conversations.history.result.noFilteredMessages}
        </p>
      ) : (
        <ol
          aria-label={strings.conversations.history.result.messagesHeading}
          tabIndex={0}
          className="max-h-[600px] space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-3 focus-visible:outline-2 focus-visible:outline-ring sm:p-4"
        >
          {filteredMessages.map((message) => (
            <ConversationMessageBubble
              key={message.sid}
              message={message}
              isCustomer={isCustomerMessage(message, participants)}
            />
          ))}
        </ol>
      )}
    </Card>
  )
}
