import type { Metadata } from "next"

import { CancelQueueTasksForm } from "@/features/taskrouter/components/cancel-queue-tasks-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.cancelQueueTasks.metadata.title,
  description: strings.taskrouter.cancelQueueTasks.metadata.description,
}

export default function CancelQueueTasksPage() {
  return <CancelQueueTasksForm />
}
