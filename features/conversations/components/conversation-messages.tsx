"use client"

import { ActionBar } from "@/components/action-bar"
import { InputActions } from "@/components/input-actions"

import { ActionButton } from "@/components/action-button"

import { EmptyState } from "@/components/empty-state"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/search-input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { exportMessages } from "@/features/conversations/lib/export-messages"
import { isCustomerMessage } from "@/features/conversations/lib/is-customer-message"
import type {
  ConversationHistoryResponse,
  Participant,
} from "@/features/conversations/types"
import { ConversationMessageBubble } from "./conversation-message-bubble"
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
  const resultActions = (
    <ActionBar className="sm:max-w-56">
      <ActionButton
        action="export"
        type="button"
        disabled={filteredMessages.length === 0}
        onClick={() => exportMessages(data.conversation.sid, filteredMessages)}
      >
        {strings.conversations.history.export.button}
      </ActionButton>
      {hasActiveFilters && (
        <ActionButton action="clear" type="button" onClick={clearFilters}>
          {strings.conversations.history.filters.clear}
        </ActionButton>
      )}
    </ActionBar>
  )
  return (
    <Card className="p-6">
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {strings.conversations.history.result.filteredMessageCount(
          filteredMessages.length,
          data.messages.length
        )}
      </p>
      {data.hasMore && (
        <p className="mb-4 rounded-md bg-warning-soft px-3 py-3 text-sm text-warning">
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
              <InputActions>
                <SearchInput
                  id="message-content-search"
                  type="search"
                  value={contentQuery}
                  onChange={(event) => setContentQuery(event.target.value)}
                  placeholder={
                    strings.conversations.history.filters.contentPlaceholder
                  }
                  className="min-w-0 flex-1"
                />
                {resultActions}
              </InputActions>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message-author-filter">
                {strings.conversations.history.filters.authorLabel}
              </Label>
              <Select
                id="message-author-filter"
                value={authorFilter}
                onChange={(event) => setAuthorFilter(event.target.value)}
                className="w-full"
              >
                <option value="">
                  {strings.conversations.history.filters.allAuthors}
                </option>
                {authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </Select>
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
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {strings.conversations.history.result.messagesHeading}
        </h3>
        {data.messages.length === 0 && resultActions}
      </div>
      {data.messages.length === 0 ? (
        <EmptyState title={strings.conversations.history.result.empty} />
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          title={strings.conversations.history.result.noFilteredMessages}
        />
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
