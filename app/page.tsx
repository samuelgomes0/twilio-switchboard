import {
  Hash,
  Layers,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react"

import { ToolCard } from "@/components/tool-card"
import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"

const tools: Tool[] = [
  {
    label: strings.dashboard.tools.conversations.label,
    description: strings.dashboard.tools.conversations.description,
    href: "/conversations",
    icon: MessageCircle,
    available: true,
  },
  {
    label: strings.dashboard.tools.taskrouter.label,
    description: strings.dashboard.tools.taskrouter.description,
    href: "/taskrouter",
    icon: Workflow,
    available: true,
  },
  {
    label: strings.dashboard.tools.settings.label,
    description: strings.dashboard.tools.settings.description,
    href: "/settings",
    icon: Settings2,
    available: true,
  },
  {
    label: strings.dashboard.tools.numbers.label,
    description: strings.dashboard.tools.numbers.description,
    href: "/numbers",
    icon: Hash,
    available: true,
  },
]

const features = [
  { icon: ShieldCheck, label: strings.dashboard.intro.features.credentials },
  { icon: Zap, label: strings.dashboard.intro.features.realtime },
  { icon: Layers, label: strings.dashboard.intro.features.multienv },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-muted/30 p-6 sm:p-8">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {strings.dashboard.intro.badge}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {strings.dashboard.title}
        </h1>

        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          {strings.dashboard.subtitle}
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
          {strings.dashboard.intro.toolsHeading}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  )
}
