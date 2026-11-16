import type {
  WorkflowDetails,
  WorkflowListResult,
  WorkflowSummary,
} from "@/features/taskrouter/types"
import { parseWorkflowConfiguration } from "@/features/taskrouter/lib/workflow-configuration"
import { getTwilioClient } from "@/lib/twilio-client"
import { toIsoString } from "@/lib/to-iso-string"

export const WORKFLOW_PAGE_SIZE = 50

interface TwilioWorkflowLike {
  sid: string
  workspaceSid: string
  friendlyName: string
  assignmentCallbackUrl?: string | null
  fallbackAssignmentCallbackUrl?: string | null
  taskReservationTimeout: number
  configuration: string
  dateCreated?: Date | string | null
  dateUpdated?: Date | string | null
}

function mapWorkflowSummary(workflow: TwilioWorkflowLike): WorkflowSummary {
  return {
    sid: workflow.sid,
    workspaceSid: workflow.workspaceSid,
    friendlyName: workflow.friendlyName,
    assignmentCallbackUrl: workflow.assignmentCallbackUrl?.trim() || null,
    fallbackAssignmentCallbackUrl:
      workflow.fallbackAssignmentCallbackUrl?.trim() || null,
    taskReservationTimeout: workflow.taskReservationTimeout,
    dateCreated: toIsoString(workflow.dateCreated),
    dateUpdated: toIsoString(workflow.dateUpdated),
  }
}

export function mapWorkflowDetails(
  workflow: TwilioWorkflowLike
): WorkflowDetails {
  const parsed = parseWorkflowConfiguration(workflow.configuration)
  return {
    ...mapWorkflowSummary(workflow),
    configuration: workflow.configuration,
    parsedConfiguration: parsed.ok ? parsed.configuration : null,
    configurationIssue: parsed.ok ? null : parsed.issue,
  }
}

export async function listWorkflows(
  workspaceSid: string,
  client: ReturnType<typeof getTwilioClient>,
  options: { friendlyName?: string; pageToken?: string } = {}
): Promise<WorkflowListResult> {
  const page = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workflows.page({
      ...(options.friendlyName
        ? { friendlyName: options.friendlyName }
        : {}),
      ...(options.pageToken ? { pageToken: options.pageToken } : {}),
      pageSize: WORKFLOW_PAGE_SIZE,
    })

  return {
    workflows: page.instances.map(mapWorkflowSummary),
    nextPageToken: readPageToken(page.nextPageUrl),
  }
}

function readPageToken(nextPageUrl: string | undefined): string | null {
  if (!nextPageUrl) return null
  return new URL(nextPageUrl, "https://taskrouter.twilio.com").searchParams.get(
    "PageToken"
  )
}

export async function getWorkflow(
  workspaceSid: string,
  workflowSid: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<WorkflowDetails> {
  const workflow = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workflows(workflowSid)
    .fetch()

  return mapWorkflowDetails(workflow)
}
