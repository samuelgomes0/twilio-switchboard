import { sseEvent } from "@/lib/sse-event"
import { updateWorkerFeature } from "@/features/taskrouter/lib/update-worker-feature"
import { MAX_ITEMS } from "@/lib/constants"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"
import { parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"
import { createSseResponse } from "@/lib/sse-response"

export async function POST(req: Request) {
  const messages = strings.taskrouter.updateWorkerFeature
  const body = await readJsonObject(req)
  if (!body) {
    return Response.json({ error: messages.invalidInput }, { status: 400 })
  }
  const { workspaceSid, workerSids, feature, enabled } = body
  const credentials = parseTwilioCredentials(body)
  if (
    typeof workspaceSid !== "string" ||
    !/^WS[0-9a-f]{32}$/i.test(workspaceSid) ||
    !Array.isArray(workerSids) ||
    workerSids.length === 0 ||
    workerSids.length > MAX_ITEMS ||
    !workerSids.every(
      (identifier: unknown) =>
        typeof identifier === "string" &&
        (/^WK[0-9a-f]{32}$/i.test(identifier) ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))
    ) ||
    typeof feature !== "string" ||
    !/^[a-zA-Z][a-zA-Z0-9_]{0,99}$/.test(feature) ||
    ["constructor", "prototype", "__proto__"].includes(feature) ||
    typeof enabled !== "boolean" ||
    !credentials
  ) {
    return Response.json({ error: messages.invalidInput }, { status: 400 })
  }
  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch {
    return Response.json({ error: messages.connectionError }, { status: 500 })
  }
  return createSseResponse(req, messages.connectionError, async (emit, signal) => {
      try {
        const result = await updateWorkerFeature(
          {
            workspaceSid,
            workerSids: [...new Set(workerSids as string[])],
            feature,
            enabled,
          },
          client,
          emit,
          signal
        )
        emit(
          sseEvent(
            result.totalErrors ? "warning" : "success",
            messages.summary(result.totalUpdated, result.totalErrors),
            { ...result, done: true }
          )
        )
      } catch {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError")
        emit(
          sseEvent("error", messages.connectionError, {
            done: true,
            totalErrors: 1,
          })
        )
      }
    }
  )
}
