import { ArrowRight } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { taskrouterTools } from "@/features/taskrouter/tools"
import { strings } from "@/lib/strings"

export default function TaskRouterPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{strings.taskrouter.page.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {strings.taskrouter.page.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {taskrouterTools.map((tool) => {
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
  )
}
