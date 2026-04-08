import { getTwilioClient } from "@/lib/twilio-client"
import { sseEvent } from "@/features/conversations/lib/close"
import type { CreateWorkflowInput } from "@/features/taskrouter/types"

const DEFAULT_QUEUE_NAME = "EVERYONE"

interface RoutingTarget {
  queue: string
  expression?: string
  skip_if?: string
}

interface WorkflowFilter {
  filter_friendly_name: string
  expression: string
  targets: RoutingTarget[]
}

function buildRoutingTargets(taskQueueSid: string): RoutingTarget[] {
  const expressions = [
    "worker.channel.chat.assigned_tasks==0",
    "worker.channel.chat.assigned_tasks<=1",
    "worker.channel.chat.assigned_tasks<=2",
    "worker.channel.chat.assigned_tasks<=3",
  ]
  const targets: RoutingTarget[] = expressions.map((expr) => ({
    queue: taskQueueSid,
    expression: expr,
    skip_if: "1==1",
  }))
  targets.push({ queue: taskQueueSid })
  return targets
}

function parseCsv(csvContent: string): Array<{ regra: string; fila: string }> {
  const lines = csvContent.split(/\r?\n/)
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = headerLine.split(";").map((h) => h.trim())

  const regraIdx = headers.indexOf("Regra de Negócio")
  const filaIdx = headers.indexOf("Fila Twilio")

  if (regraIdx === -1 || filaIdx === -1) {
    throw new Error(
      'Colunas "Regra de Negócio" e "Fila Twilio" não encontradas no CSV.'
    )
  }

  const seen = new Set<string>()
  const rows: Array<{ regra: string; fila: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = line.split(";")
    const regra = (cols[regraIdx] ?? "").trim()
    const fila = (cols[filaIdx] ?? "").trim()

    if (!regra || !fila) continue
    if (fila === "Fechar") continue

    const key = `${regra}|||${fila}`
    if (seen.has(key)) continue
    seen.add(key)

    rows.push({ regra, fila })
  }

  return rows
}

export async function createWorkflow(
  input: CreateWorkflowInput,
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<{
  workflowSid: string
  workflowName: string
  totalFilters: number
}> {
  emit(sseEvent("info", "Carregando filas do workspace..."))

  const queues = await client.taskrouter.v1
    .workspaces(input.workspaceSid)
    .taskQueues.list()

  const queueSidMap: Record<string, string> = {}
  for (const queue of queues) {
    queueSidMap[queue.friendlyName] = queue.sid
  }

  emit(sseEvent("info", `${queues.length} fila(s) carregada(s).`))

  const defaultQueueSid = queueSidMap[DEFAULT_QUEUE_NAME] ?? null
  if (!defaultQueueSid) {
    emit(
      sseEvent(
        "warning",
        `Fila "${DEFAULT_QUEUE_NAME}" não encontrada. Workflow será criado sem filtro padrão.`
      )
    )
  }

  const rows = parseCsv(input.csvContent)
  const filters: WorkflowFilter[] = []

  for (const { regra, fila } of rows) {
    const queueSid = queueSidMap[fila]
    if (!queueSid) {
      throw new Error(`Fila não encontrada no workspace: ${fila}`)
    }
    emit(sseEvent("info", `Filtro: ${regra} → ${fila} (${queueSid})`))
    filters.push({
      filter_friendly_name: regra,
      expression: `regraDeNegocio IN ['${regra}']`,
      targets: buildRoutingTargets(queueSid),
    })
  }

  emit(sseEvent("info", `Criando workflow '${input.workflowName}'...`))

  const taskRouting: {
    filters: WorkflowFilter[]
    default_filter?: { queue: string }
  } = { filters }

  if (defaultQueueSid) {
    taskRouting.default_filter = { queue: defaultQueueSid }
  }

  const configuration = { task_routing: taskRouting }

  const workflow = await client.taskrouter.v1
    .workspaces(input.workspaceSid)
    .workflows.create({
      friendlyName: input.workflowName,
      configuration: JSON.stringify(configuration),
    })

  emit(
    sseEvent(
      "success",
      `Workflow criado: ${workflow.friendlyName} | SID: ${workflow.sid}`
    )
  )

  return {
    workflowSid: workflow.sid,
    workflowName: workflow.friendlyName,
    totalFilters: filters.length,
  }
}
