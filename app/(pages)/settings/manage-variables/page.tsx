import type { Metadata } from "next"

import { VariablesManager } from "@/features/variables/components/variables-manager"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.variables.manager.metadata.title,
  description: strings.variables.manager.metadata.description,
}

export default function VariablesPage() {
  return <VariablesManager />
}
