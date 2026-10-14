export interface AssignWorkersInput {
  workspaceSid: string
  skill: string
  level?: number | null
  emails: string[]
}

export interface CreateWorkflowInput {
  workspaceSid: string
  workflowName: string
  csvContent: string
}

export type WorkflowCsvDiagnosticStatus = "valid" | "ignored" | "error"

export type WorkflowCsvDiagnosticReason =
  | "ready"
  | "incomplete-row"
  | "excluded-row"
  | "duplicate-row"
  | "invalid-rule"
  | "queue-not-found"

export interface WorkflowCsvDiagnostic {
  lineNumber: number
  rule: string
  queueName: string
  queueSid: string | null
  status: WorkflowCsvDiagnosticStatus
  reason: WorkflowCsvDiagnosticReason
}

export interface WorkflowCsvPreview {
  diagnostics: WorkflowCsvDiagnostic[]
  totalRows: number
  validRows: number
  ignoredRows: number
  errorRows: number
  defaultQueueFound: boolean | null
  canCreate: boolean
}

export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue
}

export type WorkflowTarget = JsonObject & {
  queue?: string
  priority?: number | string
  timeout?: number | string
  expression?: string
  skip_if?: string
}

export type WorkflowFilter = JsonObject & {
  filter_friendly_name?: string
  friendly_name?: string
  expression?: string
  targets?: WorkflowTarget[]
}

export type WorkflowTaskRouting = JsonObject & {
  filters?: WorkflowFilter[]
  default_filter?: WorkflowTarget
}

export type WorkflowConfiguration = JsonObject & {
  task_routing: WorkflowTaskRouting
}

export type WorkflowConfigurationIssue =
  | "invalid-json"
  | "invalid-structure"

export type WorkflowConfigurationParseResult =
  | {
      ok: true
      configuration: WorkflowConfiguration
    }
  | {
      ok: false
      issue: WorkflowConfigurationIssue
    }

export interface WorkflowSummary {
  sid: string
  workspaceSid: string
  friendlyName: string
  assignmentCallbackUrl: string | null
  fallbackAssignmentCallbackUrl: string | null
  taskReservationTimeout: number
  dateCreated: string | null
  dateUpdated: string | null
}

export interface WorkflowDetails extends WorkflowSummary {
  configuration: string
  parsedConfiguration: WorkflowConfiguration | null
  configurationIssue: WorkflowConfigurationIssue | null
}

export interface WorkflowListResult {
  workflows: WorkflowSummary[]
  nextPageToken: string | null
}

export interface TaskData {
  sid: string
  workspaceSid: string
  workflowSid: string | null
  workflowFriendlyName: string | null
  taskQueueSid: string | null
  taskQueueFriendlyName: string | null
  assignmentStatus: string
  reason: string | null
  priority: number
  age: number
  attributes: string
  dateCreated: string | null
  dateUpdated: string | null
  taskChannelUniqueName: string | null
}

export type SearchTaskResult = TaskData & {
  channel: "whatsapp" | "voice" | "unknown"
}

export interface WorkerData {
  sid: string
  workspaceSid: string
  friendlyName: string
  activitySid: string
  activityName: string
  available: boolean
  attributes: string
  dateCreated: string | null
  dateUpdated: string | null
  dateStatusChanged: string | null
}

export interface AddParticularFilterEntry {
  workflowSid: string
  taskQueueSid: string
}

export interface AddParticularFilterInput {
  workspaceSid: string
  filterName: string
  entries: AddParticularFilterEntry[]
}
export interface UpdateWorkerFeatureInput {
  workspaceSid: string
  workerSids: string[]
  feature: string
  enabled: boolean
  accountSid?: string
  authToken?: string
}
