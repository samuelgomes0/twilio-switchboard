"use client"
import * as React from "react"
import type { ConversationMessage } from "@/features/conversations/types"
export function useMessageFilters(messages: ConversationMessage[]) {
  const [contentQuery, setContentQuery] = React.useState("")
  const [authorFilter, setAuthorFilter] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const authors = Array.from(
    new Set(messages.map((message) => message.author).filter(Boolean))
  ).sort((first, second) => first.localeCompare(second, "pt-BR"))
  const normalizedQuery = contentQuery.trim().toLocaleLowerCase("pt-BR")
  const startTimestamp = startDate
    ? new Date(`${startDate}T00:00:00`).getTime()
    : null
  const endTimestamp = endDate
    ? new Date(`${endDate}T23:59:59.999`).getTime()
    : null
  const filteredMessages = messages.filter((message) => {
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
  })
  const hasActiveFilters = Boolean(
    normalizedQuery || authorFilter || startDate || endDate
  )

  function clearFilters() {
    setContentQuery("")
    setAuthorFilter("")
    setStartDate("")
    setEndDate("")
  }

  return {
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
  }
}
