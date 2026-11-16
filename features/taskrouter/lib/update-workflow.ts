import {
  getValidatedWorkflowQueueSids,
  parseWorkflowConfiguration,
  stringifyWorkflowConfiguration,
} from "@/features/taskrouter/lib/workflow-configuration"
import {
  getWorkflow,
  mapWorkflowDetails,
} from "@/features/taskrouter/lib/workflows"
import type {
  UpdateWorkflowInput,
  UpdateWorkflowResult,
} from "@/features/taskrouter/types"
import { AppError } from "@/lib/errors"
import { isRecord, isTwilioSid } from "@/lib/request-validation"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"

export const MAX_WORKFLOW_CONFIGURATION_LENGTH = 1_000_000
export const MAX_WORKFLOW_NAME_LENGTH = 256
export const MAX_WORKFLOW_CALLBACK_LENGTH = 2_048
export const MAX_TASK_RESERVATION_TIMEOUT = 86_400

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function parseOptionalCallback(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  if (
    !normalized ||
    normalized.length > MAX_WORKFLOW_CALLBACK_LENGTH ||
    !isHttpUrl(normalized)
  ) {
    return undefined
  }
  return normalized
}

function isIsoDate(value: string): boolean {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

export function parseUpdateWorkflowInput(
  value: unknown
): UpdateWorkflowInput | null {
  if (!isRecord(value)) return null

  const workspaceSid =
    typeof value.workspaceSid === "string" ? value.workspaceSid.trim() : ""
  const workflowSid =
    typeof value.workflowSid === "string" ? value.workflowSid.trim() : ""
  const friendlyName =
    typeof value.friendlyName === "string" ? value.friendlyName.trim() : ""
  const assignmentCallbackUrl = parseOptionalCallback(
    value.assignmentCallbackUrl
  )
  const fallbackAssignmentCallbackUrl = parseOptionalCallback(
    value.fallbackAssignmentCallbackUrl
  )
  const parsedConfiguration =
    typeof value.configuration === "string"
      ? parseWorkflowConfiguration(value.configuration)
      : null

  if (
    !isTwilioSid(workspaceSid, "WS") ||
    !isTwilioSid(workflowSid, "WW") ||
    !friendlyName ||
    friendlyName.length > MAX_WORKFLOW_NAME_LENGTH ||
    assignmentCallbackUrl === undefined ||
    fallbackAssignmentCallbackUrl === undefined ||
    !Number.isInteger(value.taskReservationTimeout) ||
    (value.taskReservationTimeout as number) < 1 ||
    (value.taskReservationTimeout as number) > MAX_TASK_RESERVATION_TIMEOUT ||
    typeof value.configuration !== "string" ||
    !value.configuration.trim() ||
    value.configuration.length > MAX_WORKFLOW_CONFIGURATION_LENGTH ||
    !parsedConfiguration?.ok ||
    getValidatedWorkflowQueueSids(parsedConfiguration.configuration) ===
      null ||
    typeof value.reEvaluateTasks !== "boolean" ||
    typeof value.expectedDateUpdated !== "string" ||
    !isIsoDate(value.expectedDateUpdated)
  ) {
    return null
  }

  return {
    workspaceSid,
    workflowSid,
    friendlyName,
    assignmentCallbackUrl,
    fallbackAssignmentCallbackUrl,
    taskReservationTimeout: value.taskReservationTimeout as number,
    configuration: value.configuration,
    reEvaluateTasks: value.reEvaluateTasks,
    expectedDateUpdated: value.expectedDateUpdated,
  }
}

export async function updateWorkflow(
  input: UpdateWorkflowInput,
  client: ReturnType<typeof getTwilioClient>
): Promise<UpdateWorkflowResult> {
  const parsed = parseWorkflowConfiguration(input.configuration)
  if (!parsed.ok) {
    throw new AppError(
      "validation",
      strings.taskrouter.workflows.edit.invalidConfiguration
    )
  }

  const current = await getWorkflow(
    input.workspaceSid,
    input.workflowSid,
    client
  )
  if (current.dateUpdated !== input.expectedDateUpdated) {
    throw new AppError(
      "conflict",
      strings.taskrouter.workflows.edit.concurrentChange
    )
  }

  const configurationChanged =
    !current.parsedConfiguration ||
    stringifyWorkflowConfiguration(parsed.configuration) !==
      stringifyWorkflowConfiguration(current.parsedConfiguration)

  if (configurationChanged) {
    const queueSids = getValidatedWorkflowQueueSids(parsed.configuration)
    if (!queueSids) {
      throw new AppError(
        "validation",
        strings.taskrouter.workflows.edit.invalidRouting
      )
    }
    for (const queueSid of queueSids) {
      try {
        await client.taskrouter.v1
          .workspaces(input.workspaceSid)
          .taskQueues(queueSid)
          .fetch()
      } catch (error) {
        const status =
          isRecord(error) && typeof error.status === "number"
            ? error.status
            : null
        if (status === 404) {
          throw new AppError(
            "validation",
            strings.taskrouter.workflows.edit.queueNotFound(queueSid),
            { cause: error }
          )
        }
        throw error
      }
    }
  }

  const changes = {
    ...(input.friendlyName !== current.friendlyName
      ? { friendlyName: input.friendlyName }
      : {}),
    ...(input.assignmentCallbackUrl !== current.assignmentCallbackUrl
      ? { assignmentCallbackUrl: input.assignmentCallbackUrl ?? "" }
      : {}),
    ...(input.fallbackAssignmentCallbackUrl !==
    current.fallbackAssignmentCallbackUrl
      ? {
          fallbackAssignmentCallbackUrl:
            input.fallbackAssignmentCallbackUrl ?? "",
        }
      : {}),
    ...(input.taskReservationTimeout !== current.taskReservationTimeout
      ? { taskReservationTimeout: input.taskReservationTimeout }
      : {}),
    ...(configurationChanged ? { configuration: input.configuration } : {}),
    ...(input.reEvaluateTasks ? { reEvaluateTasks: "true" } : {}),
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError(
      "validation",
      strings.taskrouter.workflows.edit.noChanges
    )
  }

  const updated = await client.taskrouter.v1
    .workspaces(input.workspaceSid)
    .workflows(input.workflowSid)
    .update(changes)

  return {
    workflow: mapWorkflowDetails(updated),
    reEvaluatedTasks: input.reEvaluateTasks,
  }
}
