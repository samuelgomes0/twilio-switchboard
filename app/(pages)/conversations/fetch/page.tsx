import type { Metadata } from "next"

import { redirect } from "next/navigation"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.conversations.fetch.metadata.title,
  description: strings.conversations.fetch.metadata.description,
}

interface FetchConversationPageProps {
  searchParams: Promise<{ sid?: string | string[] }>
}

export default async function FetchConversationPage({
  searchParams,
}: FetchConversationPageProps) {
  const { sid } = await searchParams
  const query = new URLSearchParams({ tab: "details" })
  if (typeof sid === "string") query.set("sid", sid)
  redirect(`/conversations/consult?${query}`)
}
