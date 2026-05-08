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

function inferChannel(
  attributes: string,
  taskChannel: string | null
): "whatsapp" | "voice" | "unknown" {
  try {
    const attrs = JSON.parse(attributes) as Record<string, unknown>
    const from = typeof attrs.from === "string" ? attrs.from : ""
    if (from.startsWith("whatsapp:")) return "whatsapp"
    if (from.startsWith("+") || /^\d+$/.test(from)) return "voice"
  } catch {}
  if (taskChannel === "voice") return "voice"
  return "unknown"
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
    channel: inferChannel(task.attributes, task.taskChannelUniqueName ?? null),
  }))

  return { tasks, phone }
}
