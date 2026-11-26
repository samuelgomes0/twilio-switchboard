import type { TaskData } from "@/features/taskrouter/types"

export function taskInvestigationLinks(task: TaskData, environmentId: string) {
  let conversationSid: string | null = null
  try {
    const attributes: unknown = JSON.parse(task.attributes)
    if (
      typeof attributes === "object" &&
      attributes !== null &&
      !Array.isArray(attributes)
    ) {
      const record = attributes as Record<string, unknown>
      const candidate =
        record.conversationSid ?? record.conversation_id ?? record.channelSid
      if (
        typeof candidate === "string" &&
        /^CH[0-9a-f]{32}$/i.test(candidate)
      ) {
        conversationSid = candidate
      }
    }
  } catch {
    // Malformed attributes remain inspectable as JSON without creating a guessed link.
  }

  return {
    conversation: conversationSid
      ? `/conversations/consult-by-sid?${new URLSearchParams({ environmentId, sid: conversationSid })}`
      : null,
  }
}
