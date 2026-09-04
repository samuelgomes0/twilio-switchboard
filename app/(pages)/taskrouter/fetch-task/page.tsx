import type { Metadata } from "next"

import { SearchTasksForm } from "@/features/taskrouter/components/search-tasks-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.searchTasks.metadata.title,
  description: strings.taskrouter.searchTasks.metadata.description,
}

export default function FetchTaskPage() {
  return <SearchTasksForm />
}
