import { AtSign, FileSearch2, MessageSquareOff } from "lucide-react"
import { ElementType } from "react"

import { strings } from "@/lib/strings"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const conversationsTools: Tool[] = [
  {
    label: strings.conversations.consult.title,
    description: strings.conversations.consult.subtitle,
    href: "/conversations/consult",
    icon: FileSearch2,
    available: true,
  },
  {
    label: strings.conversations.fetchByParticipant.breadcrumb,
    description: strings.conversations.fetchByParticipant.subtitle,
    href: "/conversations/fetch-by-participant",
    icon: AtSign,
    available: true,
  },
  {
    label: strings.conversations.close.breadcrumb,
    description: strings.conversations.close.subtitle,
    href: "/conversations/close",
    icon: MessageSquareOff,
    available: true,
  },
]
