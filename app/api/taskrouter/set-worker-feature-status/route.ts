import { SSE_HEADERS } from "@/lib/sse-headers"
import { sseEvent } from "@/features/conversations/lib/close"
import { updateWorkerFeature } from "@/features/taskrouter/lib/update-worker-feature"
import { MAX_ITEMS } from "@/lib/constants"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"
import { parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"

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
  const abort = new AbortController()
  const onAbort = () => abort.abort()
  req.signal.addEventListener("abort", onAbort, { once: true })
  if (req.signal.aborted) abort.abort()
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: string) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(event))
      }
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
          abort.signal
        )
        emit(
          sseEvent(
            result.totalErrors ? "warning" : "success",
            messages.summary(result.totalUpdated, result.totalErrors),
            { ...result, done: true }
          )
        )
      } catch {
        emit(
          sseEvent("error", messages.connectionError, {
            done: true,
            totalErrors: 1,
          })
        )
      } finally {
        req.signal.removeEventListener("abort", onAbort)
        if (!abort.signal.aborted) controller.close()
      }
    },
    cancel() {
      abort.abort()
    },
  })
  return new Response(stream, {
    headers: SSE_HEADERS,
  })
}
