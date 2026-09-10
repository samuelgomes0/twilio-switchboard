import { getTwilioClient } from "@/lib/twilio-client"
import type { WorkerData } from "@/features/taskrouter/types"
import { resolveWorker } from "@/features/taskrouter/lib/resolve-worker"

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
  const worker = await resolveWorker(client, workspaceSid, identifier)
  return worker ? { worker: mapWorker(worker as TwilioWorker) } : null
}
