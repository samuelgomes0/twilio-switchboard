import { permanentRedirect } from "next/navigation"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"

const s = strings.flex.page
export const metadata: Metadata = {
  title: s.metadata.title,
  description: s.metadata.description,
}

export default function Page() {
  permanentRedirect("/?area=flex")
}
