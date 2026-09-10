import type { getTwilioClient } from "@/lib/twilio-client"

export const WORKER_SID_RE = /^WK[a-f0-9]{32}$/i

export async function resolveWorker(
  client: ReturnType<typeof getTwilioClient>,
  workspaceSid: string,
  identifier: string
) {
  const normalizedIdentifier = identifier.trim()

  if (WORKER_SID_RE.test(normalizedIdentifier)) {
    try {
      return await client.taskrouter.v1
        .workspaces(workspaceSid)
        .workers(normalizedIdentifier)
        .fetch()
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) return undefined
      throw error
    }
  }

  const workers = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workers.list({ friendlyName: normalizedIdentifier, limit: 1 })

  return workers[0]
}
