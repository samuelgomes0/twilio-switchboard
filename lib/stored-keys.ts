/** Base storage keys used by StoredInput/StoredTextarea across the app. */
export const STORED_KEYS = {
  workspaceSids: "switchboard:workspace-sids",
  queueNames: "switchboard:queue-names",
  skillNames: "switchboard:skill-names",
  workflowNames: "switchboard:workflow-names",
  workerIdentifiers: "switchboard:worker-identifiers",
  conversationSids: "switchboard:conversation-sids",
  closeMessages: "switchboard:close-messages",
} as const

/** Human-readable labels for each stored key group. */
export const STORED_KEY_LABELS: Record<keyof typeof STORED_KEYS, string> = {
  workspaceSids: "Workspace SIDs",
  queueNames: "Filas (Task Queue)",
  skillNames: "Skills",
  workflowNames: "Workflows",
  workerIdentifiers: "Workers",
  conversationSids: "Conversation SIDs",
  closeMessages: "Mensagens de encerramento",
}
