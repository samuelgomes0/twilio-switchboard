import { sseEvent } from "@/features/conversations/lib/close"
import type { UpdateWorkerFeatureInput } from "@/features/taskrouter/types"
import { resolveWorker } from "@/features/taskrouter/lib/resolve-worker"
import { strings } from "@/lib/strings"
import type { getTwilioClient } from "@/lib/twilio-client"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function mergeWorkerFeature(
  raw: string,
  feature: string,
  enabled: boolean
): string {
  const attributes: unknown = JSON.parse(raw)
  if (!isObject(attributes))
    throw new Error(strings.taskrouter.updateWorkerFeature.invalidAttributes)
  const overrides =
    attributes.config_overrides === undefined ? {} : attributes.config_overrides
  if (!isObject(overrides))
    throw new Error(strings.taskrouter.updateWorkerFeature.invalidAttributes)
  const features = overrides.features === undefined ? {} : overrides.features
  if (!isObject(features))
    throw new Error(strings.taskrouter.updateWorkerFeature.invalidAttributes)
  const current = Object.hasOwn(features, feature) ? features[feature] : {}
  if (!isObject(current))
    throw new Error(strings.taskrouter.updateWorkerFeature.invalidAttributes)
  return JSON.stringify({
    ...attributes,
    config_overrides: {
      ...overrides,
      features: { ...features, [feature]: { ...current, enabled } },
    },
  })
}

export async function updateWorkerFeature(
  input: UpdateWorkerFeatureInput,
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void,
  signal: AbortSignal
) {
  const messages = strings.taskrouter.updateWorkerFeature
  let totalUpdated = 0
  let totalErrors = 0
  for (const [index, identifier] of input.workerSids.entries()) {
    if (signal.aborted) break
    emit(
      sseEvent("info", messages.processingWorker(identifier), {
        progress: { current: index + 1, total: input.workerSids.length },
      })
    )
    try {
      const worker = await resolveWorker(client, input.workspaceSid, identifier)
      if (!worker) {
        totalErrors++
        emit(sseEvent("error", messages.failedWorker(identifier)))
        continue
      }
      const workerSid = worker.sid ?? identifier
      const resource = client.taskrouter.v1
        .workspaces(input.workspaceSid)
        .workers(workerSid)
      if (signal.aborted) break
      let attributes: string
      try {
        attributes = mergeWorkerFeature(
          worker.attributes,
          input.feature,
          input.enabled
        )
      } catch {
        totalErrors++
        emit(sseEvent("error", messages.invalidWorkerAttributes(identifier)))
        continue
      }
      // Do not retry writes automatically: a timeout can follow a successful update.
      await resource.update({ attributes })
      totalUpdated++
      emit(sseEvent("success", messages.updatedWorker(identifier)))
    } catch {
      totalErrors++
      emit(sseEvent("error", messages.failedWorker(identifier)))
    }
  }
  return { totalUpdated, totalErrors }
}
