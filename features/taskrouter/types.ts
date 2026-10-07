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
