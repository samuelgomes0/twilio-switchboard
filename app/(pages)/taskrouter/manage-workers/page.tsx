import type { Metadata } from "next"

import { WorkerManagementForm } from "@/features/taskrouter/components/worker-management-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.workerManagement.title,
  description: strings.taskrouter.workerManagement.subtitle,
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string }>
}) {
  const { tab, mode } = await searchParams
  const initialTab = tab === "skills" || tab === "features" ? tab : "details"
  return (
    <WorkerManagementForm
      initialTab={initialTab}
      initialMode={mode === "individual" || mode === "batch" ? mode : undefined}
    />
  )
}
