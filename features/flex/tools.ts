import { MapPin } from "lucide-react"

import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"

export const flexTools: Tool[] = [
  {
    label: strings.flex.createAddressConfig.breadcrumb,
    description: strings.flex.createAddressConfig.subtitle,
    href: "/flex/create-conversation-address",
    icon: MapPin,
    available: true,
  },
]
