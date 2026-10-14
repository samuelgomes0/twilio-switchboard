import type { Metadata } from "next"

import { WorkflowList } from "@/features/taskrouter/components/workflow-list"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.workflows.metadata.title,
  description: strings.taskrouter.workflows.metadata.description,
}

export default function WorkflowsPage() {
  return <WorkflowList />
}
