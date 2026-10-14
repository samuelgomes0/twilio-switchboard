import type {
  WorkflowDetails,
  WorkflowListResult,
  WorkflowSummary,
} from "@/features/taskrouter/types"
import { parseWorkflowConfiguration } from "@/features/taskrouter/lib/workflow-configuration"
import { getTwilioClient } from "@/lib/twilio-client"
import { toIsoString } from "@/lib/to-iso-string"

export const DEFAULT_WORKFLOW_LIST_LIMIT = 50
export const MAX_WORKFLOW_LIST_LIMIT = 1000

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
    assignmentCallbackUrl: workflow.assignmentCallbackUrl ?? null,
    fallbackAssignmentCallbackUrl:
      workflow.fallbackAssignmentCallbackUrl ?? null,
    taskReservationTimeout: workflow.taskReservationTimeout,
    dateCreated: toIsoString(workflow.dateCreated),
    dateUpdated: toIsoString(workflow.dateUpdated),
  }
}

function mapWorkflowDetails(workflow: TwilioWorkflowLike): WorkflowDetails {
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
  options: { friendlyName?: string; limit?: number } = {}
): Promise<WorkflowListResult> {
  const limit = options.limit ?? DEFAULT_WORKFLOW_LIST_LIMIT
  const workflows = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workflows.list({
      ...(options.friendlyName
        ? { friendlyName: options.friendlyName }
        : {}),
      limit: limit + 1,
    })

  return {
    workflows: workflows.slice(0, limit).map(mapWorkflowSummary),
    hasMore: workflows.length > limit,
  }
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
