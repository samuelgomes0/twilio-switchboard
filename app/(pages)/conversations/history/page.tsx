import type { Metadata } from "next"

import { redirect } from "next/navigation"
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
  const query = new URLSearchParams({ tab: "messages" })
  if (typeof sid === "string") query.set("sid", sid)
  redirect(`/conversations/consult?${query}`)
}
