import { AtSign, MessageSquareOff, Search } from "lucide-react"
import { ElementType } from "react"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const conversationsTools: Tool[] = [
  {
    label: "Buscar Conversa",
    description:
      "Retorna estado, participantes, atributos e datas de uma conversa a partir do SID.",
    href: "/conversations/fetch",
    icon: Search,
    available: true,
  },
  {
    label: "Buscar por Participante",
    description:
      "Lista todas as conversas associadas a um endereço de participante (WhatsApp, SMS, etc.).",
    href: "/conversations/fetch-by-participant",
    icon: AtSign,
    available: true,
  },
  {
    label: "Fechar Conversas",
    description:
      "Recebe números de telefone e fecha todas as conversas ativas associadas em lote.",
    href: "/conversations/close",
    icon: MessageSquareOff,
    available: true,
  },
]
