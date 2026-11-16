import { ConversationForm } from "@/features/conversations/components/conversation-form"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: strings.conversations.consult.title,
  description: strings.conversations.consult.subtitle,
}

export default async function ConversationPage({
  searchParams,
}: {
  searchParams: Promise<{
    sid?: string | string[]
    tab?: string | string[]
    environmentId?: string | string[]
  }>
}) {
  const { sid, tab, environmentId } = await searchParams
  return (
    <ConversationForm
      key={`${typeof sid === "string" ? sid : ""}:${tab === "messages" ? "messages" : "details"}`}
      initialSid={typeof sid === "string" ? sid : ""}
      initialEnvironmentId={
        typeof environmentId === "string" ? environmentId : undefined
      }
      initialTab={tab === "messages" ? "messages" : "details"}
    />
  )
}
