import { strings } from "@/lib/strings"
/** Base storage keys used by StoredInput/StoredTextarea across the app. */
export const STORED_KEYS = {
  workspaceSids: "switchboard:workspace-sids",
  skillNames: "switchboard:skill-names",
  workerIdentifiers: "switchboard:worker-identifiers",
  conversationSids: "switchboard:conversation-sids",
  closeMessages: "switchboard:close-messages",
} as const

/** Human-readable labels for each stored key group. */
export const STORED_KEY_LABELS: Record<keyof typeof STORED_KEYS, string> = {
  workspaceSids: strings.variables.groups.workspaceSids,
  skillNames: strings.variables.groups.skillNames,
  workerIdentifiers: strings.variables.groups.workerIdentifiers,
  conversationSids: strings.variables.groups.conversationSids,
  closeMessages: strings.variables.groups.closeMessages,
}
