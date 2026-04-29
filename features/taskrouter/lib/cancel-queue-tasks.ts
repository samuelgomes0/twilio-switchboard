import { sseEvent, withRetry } from "@/features/conversations/lib/close"
import { getTwilioClient } from "@/lib/twilio-client"

const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000
const TASK_LIST_LIMIT = 1000

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

  const cancellableCount = tasks.filter((t) =>
    CANCEL_STATUSES.has(t.assignmentStatus ?? "")
  ).length
  const ignoredCount = tasks.filter((t) =>
    IGNORE_STATUSES.has(t.assignmentStatus ?? "")
  ).length

  emit(
    sseEvent(
      "info",
      `${tasks.length} task(s) encontrada(s) — elegíveis: ${cancellableCount} · ignoradas: ${ignoredCount}`
    )
  )

  let totalSuccess = 0
  let totalSkipped = ignoredCount
  let totalErrors = 0

  for (const task of tasks) {
    const status = task.assignmentStatus ?? ""

    if (IGNORE_STATUSES.has(status)) {
      emit(sseEvent("warning", `Task ${task.sid}: ignorada (${status})`))
      continue
    }

    if (!CANCEL_STATUSES.has(status)) {
      emit(
        sseEvent(
          "warning",
          `Task ${task.sid}: status inesperado "${status}" — ignorada`
        )
      )
      totalSkipped++
      continue
    }

    const attributes = parseTaskAttributes(task.attributes)
    const rawSid = extractConversationSid(attributes)
    const conversationSid = isValidConversationSid(rawSid) ? rawSid : null

    if (!conversationSid) {
      emit(
        sseEvent(
          "warning",
          `Task ${task.sid}: sem conversationSid válido — cancelando apenas a task`
        )
      )

      const result = await withRetry(
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

      if (result !== null) {
        totalSuccess++
        emit(sseEvent("success", `Task ${task.sid}: cancelada com sucesso`))
      } else {
        totalErrors++
      }
      continue
    }

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
      totalErrors++
      continue
    }
    emit(
      sseEvent(
        "info",
        `Task ${task.sid}: mensagem enviada para ${conversationSid}`
      )
    )

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
      totalErrors++
      continue
    }
    emit(
      sseEvent("info", `Task ${task.sid}: conversa ${conversationSid} fechada`)
    )

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
    if (cancelResult !== null) {
      totalSuccess++
      emit(
        sseEvent(
          "success",
          `Task ${task.sid}: cancelada com sucesso (${status} → canceled)`
        )
      )
    } else {
      totalErrors++
    }
  }

  return { totalSuccess, totalSkipped, totalErrors }
}
