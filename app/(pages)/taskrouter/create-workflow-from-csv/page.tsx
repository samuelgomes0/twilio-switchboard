import type { Metadata } from "next"

import { CreateWorkflowForm } from "@/features/taskrouter/components/create-workflow-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.createWorkflow.metadata.title,
  description: strings.taskrouter.createWorkflow.metadata.description,
}

export default function CreateWorkflowPage() {
  return <CreateWorkflowForm />
}
