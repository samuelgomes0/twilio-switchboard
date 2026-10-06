import { Hash } from "lucide-react"

import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"

export const numbersTools: Tool[] = [
  {
    label: strings.numbers.list.breadcrumb,
    description: strings.numbers.list.subtitle,
    href: "/numbers/list-messaging-numbers",
    icon: Hash,
    available: true,
  },
]
