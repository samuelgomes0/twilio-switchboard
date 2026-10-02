import { ToolCatalog } from "@/components/tool-catalog"
import { flexTools } from "@/features/flex/tools"
import { strings } from "@/lib/strings"
import type { Metadata } from "next"
const s = strings.flex.page
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
      tools={flexTools}
    />
  )
}
