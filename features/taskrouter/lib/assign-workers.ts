import { sleep, sseEvent, withRetry } from "@/features/conversations/lib/close"
import type { AssignWorkersInput } from "@/features/taskrouter/types"
import { getTwilioClient } from "@/lib/twilio-client"

const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000
const WORKER_SID_RE = /^WK[a-f0-9]{32}$/i

interface WorkerAttributes {
  routing?: {
    skills?: string[]
    levels?: Record<string, number>
    [key: string]: unknown
  }
  [key: string]: unknown
}

async function getWorker(
  client: ReturnType<typeof getTwilioClient>,
  workspaceSid: string,
  identifier: string
) {
  if (WORKER_SID_RE.test(identifier.trim())) {
    try {
      return await client.taskrouter.v1
        .workspaces(workspaceSid)
        .workers(identifier.trim())
        .fetch()
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) return undefined
      throw err
    }
  }
  const workers = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workers.list({ friendlyName: identifier })
  return workers[0]
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

  for (const identifier of input.emails) {
    emit(sseEvent("info", `Buscando worker: ${identifier}...`))

    const worker = await withRetry(
      () => getWorker(client, input.workspaceSid, identifier),
      RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      `Busca de worker (${identifier})`,
      emit
    )

    if (worker === null) {
      totalErrors++
      continue
    }

    if (worker === undefined) {
      emit(sseEvent("warning", `Worker não encontrado: ${identifier}`))
      totalSkipped++
      continue
    }

    emit(
      sseEvent(
        "info",
        `Worker encontrado: ${worker.sid} — adicionando skill "${input.skill}"...`
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
      `Atualizar worker ${worker.sid}`,
      emit
    )

    if (result !== null) {
      totalUpdated++
      emit(
        sseEvent(
          "success",
          `Skill "${input.skill}" adicionada ao worker ${identifier} (${worker.sid})`
        )
      )
    } else {
      totalErrors++
    }

    await sleep(100)
  }

  return { totalUpdated, totalSkipped, totalErrors }
}
