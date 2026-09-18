import { Layers, MessageCircle, Zap } from "lucide-react"
import type { Metadata } from "next"

import { ToolCard } from "@/components/tool-card"
import { conversationsTools } from "@/features/conversations/tools"
import { strings } from "@/lib/strings"

const s = strings.conversations.page

export const metadata: Metadata = {
  title: s.metadata.title,
  description: s.metadata.description,
}

const features = [
  { icon: MessageCircle, label: s.intro.features.channel },
  { icon: Layers, label: s.intro.features.batch },
  { icon: Zap, label: s.intro.features.realtime },
]

export default function ConversationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-muted/30 p-6 sm:p-8">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {s.intro.badge}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">{s.title}</h1>

        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          {s.subtitle}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
            >
              <Icon className="size-3 text-primary/70" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {s.intro.toolsHeading}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conversationsTools.map((tool) => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  )
}
