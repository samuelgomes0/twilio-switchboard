import type { ConversationMessage } from "@/features/conversations/types"
import { strings } from "@/lib/strings"
function escapeCsvCell(value: string | number): string {
  const raw = String(value)
  const safeValue = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${safeValue.replaceAll('"', '""')}"`
}

export function exportMessages(sid: string, messages: ConversationMessage[]) {
  const columns = strings.conversations.history.export.columns
  const rows = messages.map((message) => [
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
  downloadLink.download = `conversation-${sid}.csv`
  downloadLink.click()
  URL.revokeObjectURL(url)
}
