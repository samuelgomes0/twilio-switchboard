import { ToolDirectory } from "@/components/tool-directory"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: strings.dashboard.title,
  description: strings.dashboard.subtitle,
}

export default function DashboardPage() {
  return <ToolDirectory />
}
