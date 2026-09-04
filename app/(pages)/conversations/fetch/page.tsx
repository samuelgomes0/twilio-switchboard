import type { Metadata } from "next"

import { FetchForm } from "@/features/conversations/components/fetch-form"
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
  return <FetchForm initialSid={typeof sid === "string" ? sid : ""} />
}
