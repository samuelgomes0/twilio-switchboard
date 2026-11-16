import { ToolDirectory } from "@/components/tool-directory"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: strings.dashboard.title,
  description: strings.dashboard.subtitle,
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>
}) {
  const { area } = await searchParams
  const initialArea = typeof area === "string" ? area : ""
  return <ToolDirectory key={initialArea} initialArea={initialArea} />
}
