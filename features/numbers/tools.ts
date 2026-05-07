import { Hash } from "lucide-react"
import { ElementType } from "react"

import { strings } from "@/lib/strings"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const numbersTools: Tool[] = [
  {
    label: strings.numbers.list.breadcrumb,
    description: strings.numbers.list.subtitle,
    href: "/numbers/list",
    icon: Hash,
    available: true,
  },
]
