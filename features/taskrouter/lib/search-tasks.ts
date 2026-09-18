import { inferChannel } from "./infer-channel"
import { mapTask } from "./map-task"
import { getTwilioClient } from "@/lib/twilio-client"
import type { SearchTaskResult } from "@/features/taskrouter/types"
import { TASK_LIST_LIMIT } from "@/lib/constants"

function normalizePhone(input: string): string {
  let phone = input.trim()
  if (phone.startsWith("whatsapp:")) {
    phone = phone.slice("whatsapp:".length)
  }
  phone = phone.replace(/[\s\-().]/g, "")
  if (!phone.startsWith("+")) {
    phone = "+" + phone
  }
  return phone
}

export async function searchTasks(
  workspaceSid: string,
  phoneNumber: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ tasks: SearchTaskResult[]; phone: string }> {
  const phone = normalizePhone(phoneNumber)
  const whatsappPhone = `whatsapp:${phone}`
  const filter = `from == "${phone}" OR from == "${whatsappPhone}"`

  const rawTasks = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .tasks.list({ evaluateTaskAttributes: filter, limit: TASK_LIST_LIMIT })

  const tasks: SearchTaskResult[] = rawTasks.map((task) => ({
    ...mapTask(task),
    channel: inferChannel(task.attributes, task.taskChannelUniqueName ?? null),
  }))

  return { tasks, phone }
}
