import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const content = (
    <>
      <span className="tool-icon">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="tool-title">{tool.label}</span>
        <span className="tool-description">{tool.description}</span>
      </span>
      {tool.available ? (
        <ArrowUpRight aria-hidden="true" className="tool-arrow size-5" />
      ) : (
        <span className="text-xs text-muted-foreground">
          {strings.common.comingSoon}
        </span>
      )}
    </>
  )
  return tool.available ? (
    <Link href={tool.href} className="tool-row">
      {content}
    </Link>
  ) : (
    <div className="tool-row opacity-60" aria-disabled="true">
      {content}
    </div>
  )
}
