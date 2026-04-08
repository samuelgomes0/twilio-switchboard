import { getTwilioClient } from "@/lib/twilio-client"
import type { WorkerData } from "@/features/taskrouter/types"

const WORKER_SID_RE = /^WK[a-f0-9]{32}$/i

type TwilioWorker = Awaited<
  ReturnType<
    ReturnType<
      ReturnType<
        ReturnType<typeof getTwilioClient>["taskrouter"]["v1"]["workspaces"]
      >["workers"]
    >["fetch"]
  >
>

function mapWorker(w: TwilioWorker): WorkerData {
  return {
    sid: w.sid,
    workspaceSid: w.workspaceSid,
    friendlyName: w.friendlyName,
    activitySid: w.activitySid,
    activityName: w.activityName,
    available: w.available,
    attributes: w.attributes,
    dateCreated: w.dateCreated,
    dateUpdated: w.dateUpdated,
    dateStatusChanged: w.dateStatusChanged,
  }
}

export async function fetchWorker(
  workspaceSid: string,
  identifier: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ worker: WorkerData } | null> {
  if (WORKER_SID_RE.test(identifier.trim())) {
    const worker = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .workers(identifier.trim())
      .fetch()
    return { worker: mapWorker(worker) }
  }

  const workers = await client.taskrouter.v1
    .workspaces(workspaceSid)
    .workers.list({ friendlyName: identifier.trim(), limit: 1 })

  if (!workers[0]) return null
  return { worker: mapWorker(workers[0] as unknown as TwilioWorker) }
}
