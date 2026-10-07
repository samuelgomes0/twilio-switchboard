import type { TaskInstance } from "twilio/lib/rest/taskrouter/v1/workspace/task"
import type { TaskData } from "@/features/taskrouter/types"
import { toIsoString } from "@/lib/to-iso-string"

export function mapTask(task: TaskInstance): TaskData {
  return {
    sid: task.sid,
    workspaceSid: task.workspaceSid,
    workflowSid: task.workflowSid ?? null,
    workflowFriendlyName: task.workflowFriendlyName ?? null,
    taskQueueSid: task.taskQueueSid ?? null,
    taskQueueFriendlyName: task.taskQueueFriendlyName ?? null,
    assignmentStatus: task.assignmentStatus,
    reason: task.reason ?? null,
    priority: task.priority,
    age: task.age,
    attributes: task.attributes,
    dateCreated: toIsoString(task.dateCreated),
    dateUpdated: toIsoString(task.dateUpdated),
    taskChannelUniqueName: task.taskChannelUniqueName ?? null,
  }
}
