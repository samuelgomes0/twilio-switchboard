import type { Metadata } from "next"

import { HistoryForm } from "@/features/conversations/components/history-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.conversations.history.metadata.title,
  description: strings.conversations.history.metadata.description,
}

interface ConversationHistoryPageProps {
  searchParams: Promise<{ sid?: string | string[] }>
}

export default async function ConversationHistoryPage({
  searchParams,
}: ConversationHistoryPageProps) {
  const { sid } = await searchParams
  return <HistoryForm initialSid={typeof sid === "string" ? sid : ""} />
}
