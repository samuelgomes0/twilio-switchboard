import { sseEvent, withRetry } from "@/features/conversations/lib/close"
import {
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
  "Infelizmente tivemos um problema com a nossa conversa e ela precisará ser reiniciada. Por favor, envie uma nova mensagem."

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

  // Step 1: cancel task first — if this fails, abort to avoid sending a misleading message
  const cancelResult = await withRetry(
    () =>
      client.taskrouter.v1
        .workspaces(workspaceSid)
        .tasks(task.sid)
        .update({
          assignmentStatus: "canceled",
          reason: `Limpeza em massa da fila ${taskQueueName}`,
        }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    `Cancelar task ${task.sid}`,
    emit
  )

  if (cancelResult === null) return "error"

  if (!conversationSid) {
    emit(
      sseEvent(
        "success",
        `Task ${task.sid}: cancelada (sem conversa associada)`
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
    `Enviar mensagem para conversa ${conversationSid}`,
    emit
  )
  if (msgResult === null) {
    emit(
      sseEvent(
        "warning",
        `Task ${task.sid}: cancelada, mas falha ao enviar mensagem para ${conversationSid}`
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
    `Fechar conversa ${conversationSid}`,
    emit
  )
  if (closeResult === null) {
    emit(
      sseEvent(
        "warning",
        `Task ${task.sid}: cancelada, mas falha ao fechar conversa ${conversationSid}`
      )
    )
  } else {
    emit(
      sseEvent(
        "success",
        `Task ${task.sid}: cancelada, mensagem enviada, conversa fechada (${status} → canceled)`
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

  emit(sseEvent("info", `Buscando tasks da fila "${taskQueueName}"...`))

  const tasks = await withRetry(
    () =>
      client.taskrouter.v1.workspaces(workspaceSid).tasks.list({
        taskQueueName,
        limit: TASK_LIST_LIMIT,
      }),
    RETRY_ATTEMPTS,
    RETRY_DELAY_MS,
    `Listar tasks da fila ${taskQueueName}`,
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
      `${tasks.length} task(s) encontrada(s) — elegíveis: ${cancellableTasks.length} · ignoradas: ${ignoredCount}`
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

  const results = await Promise.allSettled(
    cancellableTasks.map(async (task) => {
      const outcome = await processSingleTask(task, taskArgs, client, emit)
      processed++
      emit(
        sseEvent("info", `Progresso: ${processed}/${cancellableTasks.length}`, {
          progress: { current: processed, total: cancellableTasks.length },
        })
      )
      return outcome
    })
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
