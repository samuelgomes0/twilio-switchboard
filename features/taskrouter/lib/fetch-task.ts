import { getTwilioClient } from "@/lib/twilio-client"
import type { TaskData } from "@/features/taskrouter/types"

export async function fetchTask(
  workspaceSid: string,
  taskSid: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ task: TaskData }> {
  const task = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .tasks(taskSid)
    .fetch()

  return {
    task: {
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
      dateCreated: task.dateCreated,
      dateUpdated: task.dateUpdated,
      taskChannelUniqueName: task.taskChannelUniqueName ?? null,
    },
  }
}
