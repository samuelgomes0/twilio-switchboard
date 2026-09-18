import { mapTask } from "./map-task"
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
    task: mapTask(task),
  }
}
