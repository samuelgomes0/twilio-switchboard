import { permanentRedirect } from "next/navigation"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"

const s = strings.conversations.page
export const metadata: Metadata = {
  title: s.metadata.title,
  description: s.metadata.description,
}

export default function Page() {
  permanentRedirect("/?area=conversations")
}
