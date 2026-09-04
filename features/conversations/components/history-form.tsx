"use client"

import {
  AlertTriangle,
  ChevronRight,
  Download,
  FileSearch2,
  History,
  Loader2,
  Search,
  X,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { StoredInput } from "@/components/stored-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { ConversationHistoryResponse } from "@/features/conversations/types"
import { useEnvironment } from "@/features/environments/context"
import { MAX_HISTORY } from "@/lib/constants"
import { STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"

const CONVERSATION_SID_PATTERN = /^CH[a-f0-9]{32}$/i
const HISTORY_KEY = "switchboard:conversation-message-history"

interface HistoryEntry {
  timestamp: number
  sid: string
  friendlyName: string | null
  messageCount: number
}

function readHistory(storageKey: string): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const value = localStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function saveHistory(storageKey: string, entry: HistoryEntry): HistoryEntry[] {
  const nextHistory = [
    entry,
    ...readHistory(storageKey).filter((item) => item.sid !== entry.sid),
  ].slice(0, MAX_HISTORY)
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextHistory))
  } catch {}
  return nextHistory
}

function formatHistoryTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(value: Date | string | null): string {
  if (!value) return strings.conversations.history.result.dateUnavailable
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  })
}

function formatFileSize(size: number | null): string | null {
  if (size === null) return null
  return new Intl.NumberFormat("pt-BR", {
    style: "unit",
    unit: "kilobyte",
    maximumFractionDigits: 1,
  }).format(size / 1024)
}

function escapeCsvCell(value: string | number): string {
  const raw = String(value)
  const safeValue = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safeValue.replaceAll('"', '""')}"`
}

export function HistoryForm({ initialSid = "" }: { initialSid?: string }) {
  const { activeEnvironment } = useEnvironment()
  const [sid, setSid] = React.useState(initialSid)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<ConversationHistoryResponse | null>(
    null
  )
  const [contentQuery, setContentQuery] = React.useState("")
  const [authorFilter, setAuthorFilter] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const historyStorageKey = activeEnvironment
    ? `${HISTORY_KEY}:${activeEnvironment.id}`
    : HISTORY_KEY
  const trimmedSid = sid.trim()
  const sidIsValid = CONVERSATION_SID_PATTERN.test(trimmedSid)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistory(readHistory(historyStorageKey))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [historyStorageKey])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeEnvironment || !sidIsValid || loading) return

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch("/api/conversations/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: trimmedSid,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const result = (await response.json()) as ConversationHistoryResponse & {
        error?: string
      }

      if (!response.ok || result.error) {
        setError(result.error ?? strings.common.unexpectedError)
        return
      }

      setData(result)
      setContentQuery("")
      setAuthorFilter("")
      setStartDate("")
      setEndDate("")
      setHistory(
        saveHistory(historyStorageKey, {
          timestamp: Date.now(),
          sid: result.conversation.sid,
          friendlyName: result.conversation.friendlyName,
          messageCount: result.messages.length,
        })
      )
    } catch {
      setError(strings.common.apiConnectionError)
    } finally {
      setLoading(false)
    }
  }

  const authors = Array.from(
    new Set(
      data?.messages.map((message) => message.author).filter(Boolean) ?? []
    )
  ).sort((first, second) => first.localeCompare(second, "pt-BR"))
  const normalizedQuery = contentQuery.trim().toLocaleLowerCase("pt-BR")
  const startTimestamp = startDate
    ? new Date(`${startDate}T00:00:00`).getTime()
    : null
  const endTimestamp = endDate
    ? new Date(`${endDate}T23:59:59.999`).getTime()
    : null
  const filteredMessages =
    data?.messages.filter((message) => {
      const messageTimestamp = message.dateCreated
        ? new Date(message.dateCreated).getTime()
        : null
      return (
        (!normalizedQuery ||
          message.body.toLocaleLowerCase("pt-BR").includes(normalizedQuery)) &&
        (!authorFilter || message.author === authorFilter) &&
        (startTimestamp === null ||
          (messageTimestamp !== null && messageTimestamp >= startTimestamp)) &&
        (endTimestamp === null ||
          (messageTimestamp !== null && messageTimestamp <= endTimestamp))
      )
    }) ?? []
  const hasActiveFilters = Boolean(
    normalizedQuery || authorFilter || startDate || endDate
  )

  function clearFilters() {
    setContentQuery("")
    setAuthorFilter("")
    setStartDate("")
    setEndDate("")
  }

  function exportFilteredMessages() {
    if (!data || filteredMessages.length === 0) return
    const columns = strings.conversations.history.export.columns
    const rows = filteredMessages.map((message) => [
      message.index,
      message.sid,
      message.author,
      message.dateCreated ? new Date(message.dateCreated).toISOString() : "",
      message.body,
      message.media
        .map((media) => media.filename ?? media.contentType ?? media.sid ?? "")
        .filter(Boolean)
        .join(" | "),
    ])
    const csv = [columns, ...rows]
      .map((row) => row.map(escapeCsvCell).join(";"))
      .join("\r\n")
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    )
    const downloadLink = document.createElement("a")
    downloadLink.href = url
    downloadLink.download = `conversation-${data.conversation.sid}.csv`
    downloadLink.click()
    URL.revokeObjectURL(url)
  }

  function clearHistory() {
    try {
      localStorage.removeItem(historyStorageKey)
    } catch {}
    setHistory([])
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/conversations"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.sidebar.sections.conversations}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">
          {strings.conversations.history.breadcrumb}
        </span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <History className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {strings.conversations.history.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.conversations.history.subtitle}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {strings.conversations.history.about}
      </p>

      {!activeEnvironment && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              {strings.common.noEnvironmentSelected.title}
            </p>
            <p className="mt-0.5 text-destructive/80">
              {strings.common.noEnvironmentSelected.message}{" "}
              <Link
                href="/settings/environments"
                className="underline underline-offset-2"
              >
                {strings.common.noEnvironmentSelected.link}
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Label htmlFor="conversation-history-sid">
          {strings.conversations.history.sidLabel}
        </Label>
        <div className="flex gap-2">
          <StoredInput
            id="conversation-history-sid"
            storageKey={STORED_KEYS.conversationSids}
            environmentId={activeEnvironment?.id}
            value={sid}
            onChange={setSid}
            placeholder={strings.conversations.history.sidPlaceholder}
            disabled={loading}
            containerClassName="flex-1"
          />
          <Button
            type="submit"
            disabled={!activeEnvironment || !sidIsValid || loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            {strings.common.search}
          </Button>
        </div>
        {trimmedSid && !sidIsValid && (
          <p className="text-xs text-destructive">
            {strings.conversations.history.sidInvalid}
          </p>
        )}
        {!trimmedSid && (
          <p className="text-xs text-muted-foreground">
            {strings.conversations.history.sidHint}
          </p>
        )}
      </form>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {data && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>
                  {data.conversation.friendlyName ??
                    strings.conversations.history.result.noFriendlyName}
                </CardTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {data.conversation.sid}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant="outline">
                  {hasActiveFilters
                    ? strings.conversations.history.result.filteredMessageCount(
                        filteredMessages.length,
                        data.messages.length
                      )
                    : strings.conversations.history.result.messageCount(
                        data.messages.length
                      )}
                </Badge>
                <Button asChild variant="outline" size="xs">
                  <Link
                    href={{
                      pathname: "/conversations/fetch",
                      query: { sid: data.conversation.sid },
                    }}
                  >
                    <FileSearch2 />
                    {strings.conversations.history.result.viewDetails}
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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
                onClick={exportFilteredMessages}
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
              <ol className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
                {filteredMessages.map((message, index) => (
                  <li key={message.sid}>
                    {index > 0 && <Separator className="mb-4" />}
                    <article className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.author ||
                              strings.conversations.history.result.systemAuthor}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{message.index}
                          </span>
                        </div>
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={
                            message.dateCreated
                              ? new Date(message.dateCreated).toISOString()
                              : undefined
                          }
                        >
                          {formatDate(message.dateCreated)}
                        </time>
                      </div>
                      {message.body ? (
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {message.body}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {strings.conversations.history.result.noText}
                        </p>
                      )}
                      {message.media.length > 0 && (
                        <ul className="space-y-1 rounded-md bg-muted/50 px-3 py-2">
                          {message.media.map((media, mediaIndex) => (
                            <li
                              key={media.sid ?? `${message.sid}-${mediaIndex}`}
                              className="text-xs text-muted-foreground"
                            >
                              {media.filename ??
                                strings.conversations.history.result.attachment}
                              {media.contentType
                                ? ` · ${media.contentType}`
                                : ""}
                              {formatFileSize(media.size)
                                ? ` · ${formatFileSize(media.size)}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {message.sid}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <section className="mt-8 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {strings.conversations.history.recent.title}
            </h2>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {strings.conversations.history.recent.clear}
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.map((entry) => (
              <li key={`${entry.timestamp}-${entry.sid}`}>
                <button
                  type="button"
                  onClick={() => setSid(entry.sid)}
                  className="w-full rounded px-1 py-0.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={strings.conversations.history.recent.reuse(
                    entry.sid
                  )}
                >
                  <span className="tabular-nums">
                    {formatHistoryTimestamp(entry.timestamp)}
                  </span>
                  {" · "}
                  <span className="font-mono break-all select-text">
                    {entry.sid}
                  </span>
                  {entry.friendlyName && (
                    <span className="italic"> · {entry.friendlyName}</span>
                  )}
                  <span>
                    {" · "}
                    {strings.conversations.history.recent.messages(
                      entry.messageCount
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
