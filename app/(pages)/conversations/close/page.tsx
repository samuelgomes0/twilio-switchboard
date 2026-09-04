import type { Metadata } from "next"

import { CloseForm } from "@/features/conversations/components/close-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.conversations.close.metadata.title,
  description: strings.conversations.close.metadata.description,
}

export default function CloseConversationsPage() {
  return <CloseForm />
}
