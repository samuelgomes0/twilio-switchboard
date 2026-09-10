import { strings } from "@/lib/strings"

export function formatConversationDate(value: Date | string | null): string {
  if (!value) return strings.conversations.history.result.dateUnavailable
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  })
}
