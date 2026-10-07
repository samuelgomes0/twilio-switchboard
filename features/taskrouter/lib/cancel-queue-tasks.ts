import { strings } from "@/lib/strings"
import { sseEvent } from "@/lib/sse-event"
import { withRetry } from "@/lib/retry"
import {
  RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  TASK_LIST_LIMIT,
} from "@/lib/constants"
import { getTwilioClient } from "@/lib/twilio-client"
import { sanitizeExternalError } from "@/lib/errors"

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

type TaskOutcome = "success" | "error"

async function processSingleTask(
  task: { sid: string; assignmentStatus: string | null; attributes: string },
  args: { workspaceSid: string; taskQueueName: string; message: string },
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void,
  processedConversations: Set<string>,
  signal?: AbortSignal
): Promise<TaskOutcome> {
  const { workspaceSid, taskQueueName, message } = args
  const status = task.assignmentStatus ?? ""

  const attributes = parseTaskAttributes(task.attributes)
  const rawSid = extractConversationSid(attributes)
  const conversationSid = isValidConversationSid(rawSid) ? rawSid : null

  // Cancel first because a failure must prevent sending a misleading message.
  try {
    signal?.throwIfAborted()
    await client.taskrouter.v1
        .workspaces(workspaceSid)
        .tasks(task.sid)
        .update({
          assignmentStatus: "canceled",
          reason: strings.taskrouter.cancelQueueTasks.log.reason(taskQueueName),
        })
  } catch (error) {
    if (signal?.aborted) throw error
    emit(
      sseEvent(
        "error",
        strings.common.retry.failed(
          strings.taskrouter.cancelQueueTasks.log.cancelLabel(task.sid),
          1,
          sanitizeExternalError(error)
        )
      )
    )
    return "error"
  }

  if (!conversationSid) {
    emit(
      sseEvent(
        "success",
        strings.taskrouter.cancelQueueTasks.log.noConversation(task.sid)
      )
    )
    return "success"
  }

  if (processedConversations.has(conversationSid)) {
    emit(
      sseEvent(
        "success",
        strings.taskrouter.cancelQueueTasks.log.conversationAlreadyProcessed(
          task.sid,
          conversationSid
        )
      )
    )
    return "success"
  }
  processedConversations.add(conversationSid)

  // Step 2: send goodbye message while conversation is still open
  try {
    signal?.throwIfAborted()
    await client.conversations.v1
        .conversations(conversationSid)
        .messages.create({ body: message })
  } catch (error) {
    if (signal?.aborted) throw error
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
  let conversationClosed = false
  try {
    signal?.throwIfAborted()
    await client.conversations.v1
        .conversations(conversationSid)
        .update({ state: "closed" })
    conversationClosed = true
  } catch (error) {
    if (signal?.aborted) throw error
    emit(
      sseEvent(
        "warning",
        strings.taskrouter.cancelQueueTasks.log.closeFailed(
          task.sid,
          conversationSid
        )
      )
    )
  }
  if (conversationClosed) {
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
  emit: (event: string) => void,
  signal?: AbortSignal
): Promise<{
  totalSuccess: number
  totalSkipped: number
  totalErrors: number
  partial: boolean
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
        limit: TASK_LIST_LIMIT + 1,
      }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    strings.taskrouter.cancelQueueTasks.log.searchLabel(taskQueueName),
    emit,
    signal
  )

  if (tasks === null) {
    return { totalSuccess: 0, totalSkipped: 0, totalErrors: 1, partial: false }
  }

  const partial = tasks.length > TASK_LIST_LIMIT
  const tasksToProcess = tasks.slice(0, TASK_LIST_LIMIT)
  if (partial) {
    emit(sseEvent("warning", strings.taskrouter.cancelQueueTasks.log.truncated(TASK_LIST_LIMIT)))
  }

  const cancellableTasks = tasksToProcess.filter((t) =>
    CANCEL_STATUSES.has(t.assignmentStatus ?? "")
  )
  const ignoredCount = tasksToProcess.filter((t) =>
    IGNORE_STATUSES.has(t.assignmentStatus ?? "")
  ).length
  const otherCount = tasksToProcess.length - cancellableTasks.length - ignoredCount

  emit(
    sseEvent(
      "info",
      strings.taskrouter.cancelQueueTasks.log.found(
        tasksToProcess.length,
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
      partial,
    }
  }

  let processed = 0
  const taskArgs = { workspaceSid, taskQueueName, message }

  const results: TaskOutcome[] = []
  const processedConversations = new Set<string>()
  for (const task of cancellableTasks) {
    signal?.throwIfAborted()
    try {
      results.push(
        await processSingleTask(
          task,
          taskArgs,
          client,
          emit,
          processedConversations,
          signal
        )
      )
    } catch (error) {
      if (signal?.aborted) throw error
      results.push("error")
    }
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
  }

  let totalSuccess = 0
  let totalErrors = 0
  const totalSkipped = ignoredCount + otherCount

  for (const result of results) {
    if (result === "success") totalSuccess++
    else totalErrors++
  }

  return { totalSuccess, totalSkipped, totalErrors, partial }
}
