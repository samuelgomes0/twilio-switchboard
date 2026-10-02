import { ToolCatalog } from "@/components/tool-catalog"
import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"
import { BookUser, Settings2, SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"
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
export const metadata: Metadata = {
  title: s.metadata.title,
  description: s.metadata.description,
}
export default function Page() {
  return (
    <ToolCatalog
      title={s.title}
      description={s.subtitle}
      eyebrow={s.intro.toolsHeading}
      tools={tools}
    />
  )
}
