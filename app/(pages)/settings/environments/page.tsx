import type { Metadata } from "next"

import { EnvironmentsManager } from "@/features/environments/components/environments-manager"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.environments.manager.metadata.title,
  description: strings.environments.manager.metadata.description,
}

export default function ManageEnvironmentsPage() {
  return <EnvironmentsManager />
}
