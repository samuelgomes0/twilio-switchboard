import { PageHeader } from "@/components/page-header"
import { ToolCard } from "@/components/tool-card"
import type { Tool } from "@/lib/tool"

export function ToolCatalog({
  title,
  description,
  eyebrow,
  tools,
}: {
  title: string
  description: string
  eyebrow: string
  tools: Tool[]
}) {
  return (
    <div className="workspace-page catalog-page">
      <PageHeader title={title} description={description} />
      <section aria-label={eyebrow}>
        <h2 className="section-heading">{eyebrow}</h2>
        <div className="tool-list">
          {tools.map((tool) => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  )
}
