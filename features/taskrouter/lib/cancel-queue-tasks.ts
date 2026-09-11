import { strings } from "@/lib/strings"
import { sseEvent, withRetry } from "@/features/conversations/lib/close"
import {
  CONCURRENCY_LIMIT,
  RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  TASK_LIST_LIMIT,
} from "@/lib/constants"
import { getTwilioClient } from "@/lib/twilio-client"

const IGNORE_STATUSES = new Set([
  "assigned",
  "wrapping",
  "completed",
  "canceled",
])
const CANCEL_STATUSES = new Set(["pending", "reserved"])

export const DEFAULT_CLOSE_MESSAGE =
  strings.taskrouter.cancelQueueTasks.defaultCloseMessage

interface TaskAttributes {
  conversationSid?: unknown
  conversation_id?: unknown
  channelSid?: unknown
}

function isValidConversationSid(sid: unknown): sid is string {
  return typeof sid === "string" && /^CH[a-fA-F0-9]{32}$/.test(sid)
}

function parseTaskAttributes(raw: string | null | undefined): TaskAttributes {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as TaskAttributes
  } catch {
    return {}
  }
}

function extractConversationSid(attributes: TaskAttributes): string | null {
  if (typeof attributes.conversationSid === "string")
    return attributes.conversationSid
  if (typeof attributes.conversation_id === "string")
    return attributes.conversation_id
  if (typeof attributes.channelSid === "string") return attributes.channelSid
  return null
}

type TaskOutcome = "success" | "skipped" | "error"

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

async function processSingleTask(
  task: { sid: string; assignmentStatus: string | null; attributes: string },
  args: { workspaceSid: string; taskQueueName: string; message: string },
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<TaskOutcome> {
  const { workspaceSid, taskQueueName, message } = args
  const status = task.assignmentStatus ?? ""

  if (!CANCEL_STATUSES.has(status)) return "skipped"

  const attributes = parseTaskAttributes(task.attributes)
  const rawSid = extractConversationSid(attributes)
  const conversationSid = isValidConversationSid(rawSid) ? rawSid : null

  // Cancel first because a failure must prevent sending a misleading message.
  const cancelResult = await withRetry(
    () =>
      client.taskrouter.v1
        .workspaces(workspaceSid)
        .tasks(task.sid)
        .update({
          assignmentStatus: "canceled",
          reason: strings.taskrouter.cancelQueueTasks.log.reason(taskQueueName),
        }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    strings.taskrouter.cancelQueueTasks.log.cancelLabel(task.sid),
    emit
  )

  if (cancelResult === null) return "error"

  if (!conversationSid) {
    emit(
      sseEvent(
        "success",
        strings.taskrouter.cancelQueueTasks.log.noConversation(task.sid)
      )
    )
    return "success"
  }

  // Step 2: send goodbye message while conversation is still open
  const msgResult = await withRetry(
    () =>
      client.conversations.v1
        .conversations(conversationSid)
        .messages.create({ body: message }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    strings.taskrouter.cancelQueueTasks.log.messageLabel(conversationSid),
    emit
  )
  if (msgResult === null) {
    emit(
      sseEvent(
        "warning",
        strings.taskrouter.cancelQueueTasks.log.messageFailed(
          task.sid,
          conversationSid
        )
      )
    )
  }

  // Step 3: close conversation
  const closeResult = await withRetry(
    () =>
      client.conversations.v1
        .conversations(conversationSid)
        .update({ state: "closed" }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    strings.conversations.close.log.closeLabel(conversationSid),
    emit
  )
  if (closeResult === null) {
    emit(
      sseEvent(
        "warning",
        strings.taskrouter.cancelQueueTasks.log.closeFailed(
          task.sid,
          conversationSid
        )
      )
    )
  } else {
    emit(
      sseEvent(
        "success",
        strings.taskrouter.cancelQueueTasks.log.closed(task.sid, status)
      )
    )
  }

  return "success"
}

export async function cancelQueueTasks(
  {
    workspaceSid,
    taskQueueName,
    closeMessage,
  }: {
    workspaceSid: string
    taskQueueName: string
    closeMessage?: string
  },
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<{
  totalSuccess: number
  totalSkipped: number
  totalErrors: number
}> {
  const message = closeMessage?.trim() || DEFAULT_CLOSE_MESSAGE

  emit(
    sseEvent(
      "info",
      strings.taskrouter.cancelQueueTasks.log.searching(taskQueueName)
    )
  )

  const tasks = await withRetry(
    () =>
      client.taskrouter.v1.workspaces(workspaceSid).tasks.list({
        taskQueueName,
        limit: TASK_LIST_LIMIT,
      }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    strings.taskrouter.cancelQueueTasks.log.searchLabel(taskQueueName),
    emit
  )

  if (tasks === null) {
    return { totalSuccess: 0, totalSkipped: 0, totalErrors: 1 }
  }

  const cancellableTasks = tasks.filter((t) =>
    CANCEL_STATUSES.has(t.assignmentStatus ?? "")
  )
  const ignoredCount = tasks.filter((t) =>
    IGNORE_STATUSES.has(t.assignmentStatus ?? "")
  ).length
  const otherCount = tasks.length - cancellableTasks.length - ignoredCount

  emit(
    sseEvent(
      "info",
      strings.taskrouter.cancelQueueTasks.log.found(
        tasks.length,
        cancellableTasks.length,
        ignoredCount
      )
    )
  )

  if (cancellableTasks.length === 0) {
    return {
      totalSuccess: 0,
      totalSkipped: ignoredCount + otherCount,
      totalErrors: 0,
    }
  }

  let processed = 0
  const taskArgs = { workspaceSid, taskQueueName, message }

  const results = await processInBatches(
    cancellableTasks,
    CONCURRENCY_LIMIT,
    async (task) => {
      const outcome = await processSingleTask(task, taskArgs, client, emit)
      processed++
      emit(
        sseEvent(
          "info",
          strings.taskrouter.cancelQueueTasks.log.progress(
            processed,
            cancellableTasks.length
          ),
          {
            progress: { current: processed, total: cancellableTasks.length },
          }
        )
      )
      return outcome
    }
  )

  let totalSuccess = 0
  let totalErrors = 0
  let totalSkipped = ignoredCount + otherCount

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value === "success") totalSuccess++
      else if (result.value === "skipped") totalSkipped++
      else totalErrors++
    } else {
      totalErrors++
    }
  }

  return { totalSuccess, totalSkipped, totalErrors }
}
