import { ArrowRight, BookUser, Layers, Puzzle, Settings2, ShieldCheck, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import type { ElementType } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { strings } from "@/lib/strings"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

const tools: Tool[] = [
  {
    label: strings.environments.page.tools.manage.label,
    description: strings.environments.page.tools.manage.description,
    href: "/settings/environments",
    icon: Settings2,
    available: true,
  },
  {
    label: strings.environments.page.tools.contacts.label,
    description: strings.environments.page.tools.contacts.description,
    href: "/settings/contacts",
    icon: BookUser,
    available: true,
  },
  {
    label: strings.environments.page.tools.variables.label,
    description: strings.environments.page.tools.variables.description,
    href: "/settings/variables",
    icon: SlidersHorizontal,
    available: true,
  },
]

const s = strings.environments.page

const features = [
  { icon: Layers, label: s.intro.features.multienv },
  { icon: ShieldCheck, label: s.intro.features.local },
  { icon: Puzzle, label: s.intro.features.aux },
]

export default function EnvironmentsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-muted/30 p-6 sm:p-8">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {s.intro.badge}
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">{s.title}</h1>

        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
          {s.intro.description}
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
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {s.intro.toolsHeading}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon

            if (!tool.available) {
              return (
                <Card
                  key={tool.href}
                  className="cursor-not-allowed opacity-60 select-none"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {strings.common.comingSoon}
                      </span>
                    </div>
                    <CardTitle className="mt-3">{tool.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            }

            return (
              <Link key={tool.href} href={tool.href} className="group block">
                <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <CardTitle className="mt-3">{tool.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
