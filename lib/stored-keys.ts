import { strings } from "@/lib/strings"
/** Base storage keys used by StoredInput/StoredTextarea across the app. */
export const STORED_KEYS = {
  workspaceSids: "switchboard:workspace-sids",
  queueNames: "switchboard:queue-names",
  skillNames: "switchboard:skill-names",
  workflowNames: "switchboard:workflow-names",
  workerIdentifiers: "switchboard:worker-identifiers",
  conversationSids: "switchboard:conversation-sids",
  closeMessages: "switchboard:close-messages",
  flexAddresses: "switchboard:flex-addresses",
  conversationServiceSids: "switchboard:conversation-service-sids",
  studioFlowSids: "switchboard:studio-flow-sids",
} as const

/** Human-readable labels for each stored key group. */
export const STORED_KEY_LABELS: Record<keyof typeof STORED_KEYS, string> = {
  workspaceSids: strings.variables.groups.workspaceSids,
  queueNames: strings.variables.groups.queueNames,
  skillNames: strings.variables.groups.skillNames,
  workflowNames: strings.variables.groups.workflowNames,
  workerIdentifiers: strings.variables.groups.workerIdentifiers,
  conversationSids: strings.variables.groups.conversationSids,
  closeMessages: strings.variables.groups.closeMessages,
  flexAddresses: strings.variables.groups.flexAddresses,
  conversationServiceSids: strings.variables.groups.conversationServiceSids,
  studioFlowSids: strings.variables.groups.studioFlowSids,
}
