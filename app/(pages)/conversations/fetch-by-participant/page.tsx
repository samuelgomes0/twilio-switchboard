import type { Metadata } from "next"

import { FetchByParticipantForm } from "@/features/conversations/components/fetch-by-participant-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.conversations.fetchByParticipant.metadata.title,
  description: strings.conversations.fetchByParticipant.metadata.description,
}

export default function FetchByParticipantPage() {
  return <FetchByParticipantForm />
}
