import type { Metadata } from "next"

import { AssignWorkersForm } from "@/features/taskrouter/components/assign-workers-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.assignWorkers.metadata.title,
  description: strings.taskrouter.assignWorkers.metadata.description,
}

export default function AssignWorkersPage() {
  return <AssignWorkersForm />
}
