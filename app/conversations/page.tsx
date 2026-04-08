import { ArrowRight, MessageSquareOff, Search } from "lucide-react"
import Link from "next/link"
import type { ElementType } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

const tools: Tool[] = [
  {
    label: "Fechar Conversas",
    description:
      "Recebe números de telefone e fecha todas as conversas ativas associadas em lote.",
    href: "/conversations/close",
    icon: MessageSquareOff,
    available: true,
  },
  {
    label: "Buscar Conversa",
    description:
      "Retorna estado, participantes, atributos e datas de uma conversa a partir do SID.",
    href: "/conversations/fetch",
    icon: Search,
    available: true,
  },
]

export default function ConversationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Feche conversas ativas em lote e consulte detalhes de conversas por
          SID.
        </p>
      </div>

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
                      Em breve
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
