import { MapPin } from "lucide-react"
import { ElementType } from "react"

import { strings } from "@/lib/strings"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const flexTools: Tool[] = [
  {
    label: strings.flex.createAddressConfig.breadcrumb,
    description: strings.flex.createAddressConfig.subtitle,
    href: "/flex/create-address-config",
    icon: MapPin,
    available: true,
  },
]
