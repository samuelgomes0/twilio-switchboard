import { strings } from "@/lib/strings"
import { AppError } from "@/lib/errors"
import { sseEvent } from "@/lib/sse-event"
import type {
  CreateWorkflowInput,
  WorkflowConfiguration,
  WorkflowCsvDiagnostic,
  WorkflowCsvPreview,
  WorkflowFilter,
  WorkflowTarget,
} from "@/features/taskrouter/types"
import { getTwilioClient } from "@/lib/twilio-client"
import { isSafeTaskRouterLiteral } from "@/features/taskrouter/lib/taskrouter-expression"

const DEFAULT_QUEUE_NAME = "EVERYONE"

function buildRoutingTargets(taskQueueSid: string): WorkflowTarget[] {
  const expressions = [
    "worker.channel.chat.assigned_tasks==0",
    "worker.channel.chat.assigned_tasks<=1",
    "worker.channel.chat.assigned_tasks<=2",
    "worker.channel.chat.assigned_tasks<=3",
  ]
  const targets: WorkflowTarget[] = expressions.map((expr) => ({
    queue: taskQueueSid,
    expression: expr,
    skip_if: "1==1",
  }))
  targets.push({ queue: taskQueueSid })
  return targets
}

interface CsvRow {
  lineNumber: number
  columns: string[]
}

interface WorkflowCsvAnalysis {
  diagnostics: WorkflowCsvDiagnostic[]
  rows: Array<{ regra: string; fila: string }>
}

function parseSemicolonRows(csvContent: string): CsvRow[] {
  const rows: CsvRow[] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  let closedQuote = false
  let lineNumber = 1
  let rowLineNumber = 1

  function finishCell() {
    row.push(cell)
    cell = ""
    closedQuote = false
  }

  function finishRow() {
    finishCell()
    rows.push({ lineNumber: rowLineNumber, columns: row })
    row = []
  }

  for (let index = 0; index < csvContent.length; index++) {
    const character = csvContent[index]
    if (quoted) {
      if (character === '"') {
        if (csvContent[index + 1] === '"') {
          cell += '"'
          index++
        } else {
          quoted = false
          closedQuote = true
        }
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && csvContent[index + 1] === "\n") {
          cell += "\r\n"
          index++
        } else {
          cell += character
        }
        lineNumber++
      } else {
        cell += character
      }
      continue
    }
    if (character === '"') {
      if (cell.length > 0 || closedQuote) throw new Error("invalid-csv")
      quoted = true
    } else if (character === ";") {
      finishCell()
    } else if (character === "\n" || character === "\r") {
      finishRow()
      if (character === "\r" && csvContent[index + 1] === "\n") index++
      lineNumber++
      rowLineNumber = lineNumber
    } else if (closedQuote) {
      if (character !== " " && character !== "\t")
        throw new Error("invalid-csv")
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error("invalid-csv")
  if (cell.length > 0 || row.length > 0) finishRow()
  return rows
}

export function parseWorkflowCsv(
  csvContent: string
): Array<{ regra: string; fila: string }> {
  const analysis = analyzeWorkflowCsv(csvContent)
  if (analysis.diagnostics.some(({ reason }) => reason === "invalid-rule")) {
    throw new AppError(
      "validation",
      strings.taskrouter.createWorkflow.log.invalidRule
    )
  }
  if (analysis.rows.length === 0) {
    throw new AppError(
      "validation",
      strings.taskrouter.createWorkflow.log.noValidRows
    )
  }
  return analysis.rows
}

export function analyzeWorkflowCsv(csvContent: string): WorkflowCsvAnalysis {
  let parsedRows: CsvRow[]
  try {
    parsedRows = parseSemicolonRows(csvContent.replace(/^\uFEFF/, ""))
  } catch {
    throw new AppError(
      "validation",
      strings.taskrouter.createWorkflow.log.invalidCsv
    )
  }
  const [headerRow, ...dataRows] = parsedRows
  if (!headerRow) {
    throw new AppError(
      "validation",
      strings.taskrouter.createWorkflow.log.invalidColumns
    )
  }
  const headers = headerRow.columns.map((header) => header.trim())

  const regraIdx = headers.indexOf("Regra de Negócio")
  const filaIdx = headers.indexOf("Fila Twilio")

  if (regraIdx === -1 || filaIdx === -1) {
    throw new AppError(
      "validation",
      strings.taskrouter.createWorkflow.log.invalidColumns
    )
  }

  const seen = new Set<string>()
  const rows: Array<{ regra: string; fila: string }> = []
  const diagnostics: WorkflowCsvDiagnostic[] = []

  for (const { lineNumber: rowNumber, columns: cols } of dataRows) {
    if (cols.every((column) => !column.trim())) continue
    const regra = (cols[regraIdx] ?? "").trim()
    const fila = (cols[filaIdx] ?? "").trim()

    if (!regra || !fila) {
      diagnostics.push({
        lineNumber: rowNumber,
        rule: regra,
        queueName: fila,
        queueSid: null,
        status: "ignored",
        reason: "incomplete-row",
      })
      continue
    }
    if (fila === "Fechar" || fila === "-" || regra === "-") {
      diagnostics.push({
        lineNumber: rowNumber,
        rule: regra,
        queueName: fila,
        queueSid: null,
        status: "ignored",
        reason: "excluded-row",
      })
      continue
    }
    if (!isSafeTaskRouterLiteral(regra)) {
      diagnostics.push({
        lineNumber: rowNumber,
        rule: regra,
        queueName: fila,
        queueSid: null,
        status: "error",
        reason: "invalid-rule",
      })
      continue
    }

    const key = `${regra}|||${fila}`
    if (seen.has(key)) {
      diagnostics.push({
        lineNumber: rowNumber,
        rule: regra,
        queueName: fila,
        queueSid: null,
        status: "ignored",
        reason: "duplicate-row",
      })
      continue
    }
    seen.add(key)

    rows.push({ regra, fila })
    diagnostics.push({
      lineNumber: rowNumber,
      rule: regra,
      queueName: fila,
      queueSid: null,
      status: "valid",
      reason: "ready",
    })
  }
  return { diagnostics, rows }
}

async function loadTaskQueueMap(
  workspaceSid: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ queueSidMap: Map<string, string>; queueCount: number }> {
  const queues = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .taskQueues.list()
  return {
    queueSidMap: new Map(
      queues.map((queue) => [queue.friendlyName, queue.sid])
    ),
    queueCount: queues.length,
  }
}

function resolveWorkflowCsvDiagnostics(
  diagnostics: WorkflowCsvDiagnostic[],
  queueSidMap: Map<string, string>
): WorkflowCsvDiagnostic[] {
  return diagnostics.map((diagnostic) => {
    if (diagnostic.status !== "valid") return diagnostic
    const queueSid = queueSidMap.get(diagnostic.queueName)
    return queueSid
      ? { ...diagnostic, queueSid }
      : {
          ...diagnostic,
          status: "error",
          reason: "queue-not-found",
        }
  })
}

export async function previewWorkflowCsv(
  input: Pick<CreateWorkflowInput, "workspaceSid" | "csvContent">,
  client: ReturnType<typeof getTwilioClient>
): Promise<WorkflowCsvPreview> {
  const analysis = analyzeWorkflowCsv(input.csvContent)
  const rowsReadyForResolution = analysis.diagnostics.some(
    ({ status }) => status === "valid"
  )
  if (!rowsReadyForResolution) {
    const errorRows = analysis.diagnostics.filter(
      ({ status }) => status === "error"
    ).length
    return {
      diagnostics: analysis.diagnostics,
      totalRows: analysis.diagnostics.length,
      validRows: 0,
      ignoredRows: analysis.diagnostics.filter(
        ({ status }) => status === "ignored"
      ).length,
      errorRows,
      defaultQueueFound: null,
      canCreate: false,
    }
  }

  const { queueSidMap } = await loadTaskQueueMap(input.workspaceSid, client)
  const diagnostics = resolveWorkflowCsvDiagnostics(
    analysis.diagnostics,
    queueSidMap
  )
  const validRows = diagnostics.filter(({ status }) => status === "valid").length
  const ignoredRows = diagnostics.filter(
    ({ status }) => status === "ignored"
  ).length
  const errorRows = diagnostics.filter(({ status }) => status === "error").length

  return {
    diagnostics,
    totalRows: diagnostics.length,
    validRows,
    ignoredRows,
    errorRows,
    defaultQueueFound: queueSidMap.has(DEFAULT_QUEUE_NAME),
    canCreate: validRows > 0 && errorRows === 0,
  }
}

export async function createWorkflow(
  input: CreateWorkflowInput,
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void,
  signal?: AbortSignal
): Promise<{
  workflowSid: string
  workflowName: string
  totalFilters: number
}> {
  const rows = parseWorkflowCsv(input.csvContent)
  emit(sseEvent("info", strings.taskrouter.createWorkflow.log.loadingQueues))
  signal?.throwIfAborted()

  const { queueSidMap, queueCount } = await loadTaskQueueMap(
    input.workspaceSid,
    client
  )
  signal?.throwIfAborted()

  emit(
    sseEvent(
      "info",
      strings.taskrouter.createWorkflow.log.queuesLoaded(queueCount)
    )
  )

  const defaultQueueSid = queueSidMap.get(DEFAULT_QUEUE_NAME) ?? null
  if (!defaultQueueSid) {
    emit(
      sseEvent(
        "warning",
        strings.taskrouter.createWorkflow.log.noDefaultQueue(DEFAULT_QUEUE_NAME)
      )
    )
  }

  const filters: WorkflowFilter[] = []

  for (const { regra, fila } of rows) {
    signal?.throwIfAborted()
    const queueSid = queueSidMap.get(fila)
    if (!queueSid) {
      throw new AppError(
        "validation",
        strings.taskrouter.createWorkflow.log.queueNotFound(fila)
      )
    }
    emit(
      sseEvent(
        "info",
        strings.taskrouter.createWorkflow.log.filter(regra, fila, queueSid)
      )
    )
    filters.push({
      filter_friendly_name: regra,
      expression: `regraDeNegocio IN ['${regra}']`,
      targets: buildRoutingTargets(queueSid),
    })
  }

  emit(
    sseEvent(
      "info",
      strings.taskrouter.createWorkflow.log.creating(input.workflowName)
    )
  )

  const taskRouting: WorkflowConfiguration["task_routing"] = { filters }

  if (defaultQueueSid) {
    taskRouting.default_filter = { queue: defaultQueueSid }
  }

  const configuration: WorkflowConfiguration = { task_routing: taskRouting }

  signal?.throwIfAborted()
  const workflow = await client.taskrouter.v1
    .workspaces(input.workspaceSid)
    .workflows.create({
      friendlyName: input.workflowName,
      configuration: JSON.stringify(configuration),
    })

  emit(
    sseEvent(
      "success",
      strings.taskrouter.createWorkflow.log.created(
        workflow.friendlyName,
        workflow.sid
      )
    )
  )

  return {
    workflowSid: workflow.sid,
    workflowName: workflow.friendlyName,
    totalFilters: filters.length,
  }
}
