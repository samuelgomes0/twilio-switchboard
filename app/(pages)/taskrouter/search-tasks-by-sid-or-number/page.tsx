import type { Metadata } from "next"

import { SearchTasksForm } from "@/features/taskrouter/components/search-tasks-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.searchTasks.metadata.title,
  description: strings.taskrouter.searchTasks.metadata.description,
}

export default async function SearchTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    phone?: string | string[]
    environmentId?: string | string[]
  }>
}) {
  const { phone, environmentId } = await searchParams
  return (
    <SearchTasksForm
      key={`${typeof phone === "string" ? phone : ""}:${typeof environmentId === "string" ? environmentId : ""}`}
      initialPhone={typeof phone === "string" ? phone : ""}
      initialEnvironmentId={
        typeof environmentId === "string" ? environmentId : undefined
      }
    />
  )
}
