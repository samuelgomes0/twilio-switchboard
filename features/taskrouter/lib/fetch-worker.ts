import { getTwilioClient } from "@/lib/twilio-client"
import type { WorkerData } from "@/features/taskrouter/types"
import { resolveWorker } from "@/features/taskrouter/lib/resolve-worker"
import { toIsoString } from "@/lib/to-iso-string"

type TwilioWorker = NonNullable<Awaited<ReturnType<typeof resolveWorker>>>

function mapWorker(w: TwilioWorker): WorkerData {
  return {
    sid: w.sid,
    workspaceSid: w.workspaceSid,
    friendlyName: w.friendlyName,
    activitySid: w.activitySid,
    activityName: w.activityName,
    available: w.available,
    attributes: w.attributes,
    dateCreated: toIsoString(w.dateCreated),
    dateUpdated: toIsoString(w.dateUpdated),
    dateStatusChanged: toIsoString(w.dateStatusChanged),
  }
}

export async function fetchWorker(
  workspaceSid: string,
  identifier: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<{ worker: WorkerData } | null> {
  const worker = await resolveWorker(client, workspaceSid, identifier)
  return worker ? { worker: mapWorker(worker) } : null
}
