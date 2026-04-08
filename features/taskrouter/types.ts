export interface AssignWorkersInput {
  workspaceSid: string
  skill: string
  level?: number | null
  emails: string[]
  accountSid?: string
  authToken?: string
}

export interface CreateWorkflowInput {
  workspaceSid: string
  workflowName: string
  csvContent: string
  accountSid?: string
  authToken?: string
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
  dateCreated: Date | null
  dateUpdated: Date | null
  taskChannelUniqueName: string | null
}

export interface WorkerData {
  sid: string
  workspaceSid: string
  friendlyName: string
  activitySid: string
  activityName: string
  available: boolean
  attributes: string
  dateCreated: Date | null
  dateUpdated: Date | null
  dateStatusChanged: Date | null
}
