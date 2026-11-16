import type { Metadata } from "next"

import { WorkflowDetails } from "@/features/taskrouter/components/workflow-details"
import { strings } from "@/lib/strings"

export const metadata: Metadata = {
  title: strings.taskrouter.workflows.details.title,
  description: strings.taskrouter.workflows.details.subtitle,
}

export default async function WorkflowDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowSid: string }>
  searchParams: Promise<{
    workspaceSid?: string | string[]
    environmentId?: string | string[]
  }>
}) {
  const [{ workflowSid }, { workspaceSid, environmentId }] = await Promise.all([
    params,
    searchParams,
  ])
  return (
    <WorkflowDetails
      key={`${workflowSid}:${typeof workspaceSid === "string" ? workspaceSid : ""}:${typeof environmentId === "string" ? environmentId : ""}`}
      initialEnvironmentId={
        typeof environmentId === "string" ? environmentId : undefined
      }
      initialWorkflowSid={workflowSid}
      initialWorkspaceSid={typeof workspaceSid === "string" ? workspaceSid : ""}
    />
  )
}
