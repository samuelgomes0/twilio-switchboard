import { inferChannel } from "@/features/taskrouter/lib/infer-channel"
import { mapTask } from "@/features/taskrouter/lib/map-task"
import { getTwilioClient } from "@/lib/twilio-client"
import type { SearchTaskResult } from "@/features/taskrouter/types"
import { TASK_LIST_LIMIT } from "@/lib/constants"

export function normalizeTaskPhone(input: string): string | null {
  let phone = input.trim()
  if (phone.startsWith("whatsapp:")) {
    phone = phone.slice("whatsapp:".length)
  }
  phone = phone.replace(/[\s\-().]/g, "")
  if (!phone.startsWith("+")) {
    phone = "+" + phone
  }
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null
}

export async function searchTasks(
  workspaceSid: string,
  phoneNumber: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ tasks: SearchTaskResult[]; phone: string }> {
  const phone = normalizeTaskPhone(phoneNumber)
  if (!phone) throw new Error("Invalid phone number")
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
