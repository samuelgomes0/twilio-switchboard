import type { WorkspaceListResult } from "@/features/taskrouter/types"
import type { getTwilioClient } from "@/lib/twilio-client"

export async function listWorkspaces(
  client: ReturnType<typeof getTwilioClient>,
  pageToken?: string
): Promise<WorkspaceListResult> {
  const page = await client.taskrouter.v1.workspaces.page({
    pageSize: 50,
    ...(pageToken ? { pageToken } : {}),
  })
  return {
    workspaces: page.instances.map(({ sid, friendlyName }) => ({
      sid,
      friendlyName,
    })),
    nextPageToken: page.nextPageUrl
      ? new URL(
          page.nextPageUrl,
          "https://taskrouter.twilio.com"
        ).searchParams.get("PageToken")
      : null,
  }
}
