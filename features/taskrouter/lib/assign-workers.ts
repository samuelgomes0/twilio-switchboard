import { strings } from "@/lib/strings"
import { sleep, sseEvent, withRetry } from "@/features/conversations/lib/close"
import type { AssignWorkersInput } from "@/features/taskrouter/types"
import { RETRY_ATTEMPTS, RETRY_DELAY_MS } from "@/lib/constants"
import { getTwilioClient } from "@/lib/twilio-client"
import { resolveWorker } from "@/features/taskrouter/lib/resolve-worker"

interface WorkerAttributes {
  routing?: {
    skills?: string[]
    levels?: Record<string, number>
    [key: string]: unknown
  }
  [key: string]: unknown
}

async function addSkillToWorker(
  client: ReturnType<typeof getTwilioClient>,
  workspaceSid: string,
  workerSid: string,
  currentAttributes: string,
  skill: string,
  level: number | null | undefined
) {
  const attrs = JSON.parse(currentAttributes) as WorkerAttributes
  const routing = attrs.routing ?? (attrs.routing = {})
  const skills: string[] = routing.skills ?? (routing.skills = [])
  const levels: Record<string, number> = routing.levels ?? (routing.levels = {})

  if (!skills.includes(skill)) skills.push(skill)
  if (level !== null && level !== undefined) levels[skill] = level

  await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workers(workerSid)
    .update({
      attributes: JSON.stringify(attrs),
    })
}

export async function assignWorkersToQueue(
  input: AssignWorkersInput,
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<{
  totalUpdated: number
  totalSkipped: number
  totalErrors: number
}> {
  let totalUpdated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (let idx = 0; idx < input.emails.length; idx++) {
    const identifier = input.emails[idx]
    emit(
      sseEvent(
        "info",
        strings.taskrouter.assignWorkers.log.searching(identifier),
        {
          progress: { current: idx + 1, total: input.emails.length },
        }
      )
    )

    const worker = await withRetry(
      () => resolveWorker(client, input.workspaceSid, identifier),
      RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      strings.taskrouter.assignWorkers.log.searchLabel(identifier),
      emit
    )

    if (worker === null) {
      totalErrors++
      continue
    }

    if (worker === undefined) {
      emit(
        sseEvent(
          "warning",
          strings.taskrouter.assignWorkers.log.notFound(identifier)
        )
      )
      totalSkipped++
      continue
    }

    emit(
      sseEvent(
        "info",
        strings.taskrouter.assignWorkers.log.addingSkill(
          worker.sid,
          input.skill
        )
      )
    )

    const result = await withRetry(
      () =>
        addSkillToWorker(
          client,
          input.workspaceSid,
          worker.sid,
          worker.attributes,
          input.skill,
          input.level
        ),
      RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      strings.taskrouter.assignWorkers.log.updateLabel(worker.sid),
      emit
    )

    if (result !== null) {
      totalUpdated++
      emit(
        sseEvent(
          "success",
          strings.taskrouter.assignWorkers.log.updated(
            input.skill,
            identifier,
            worker.sid
          )
        )
      )
    } else {
      totalErrors++
    }

    await sleep(100)
  }

  return { totalUpdated, totalSkipped, totalErrors }
}
