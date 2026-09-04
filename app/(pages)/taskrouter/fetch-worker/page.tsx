import type { Metadata } from "next"

import { FetchWorkerForm } from "@/features/taskrouter/components/fetch-worker-form"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.fetchWorker.metadata.title,
  description: strings.taskrouter.fetchWorker.metadata.description,
}

export default function FetchWorkerPage() {
  return <FetchWorkerForm />
}
