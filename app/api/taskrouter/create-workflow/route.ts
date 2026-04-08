import { createWorkflow } from "@/features/taskrouter/lib/create-workflow"
import { sseEvent } from "@/features/conversations/lib/close"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    workflowName?: unknown
    csvContent?: unknown
    accountSid?: string
    authToken?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return new Response(
      JSON.stringify({
        error: "workspaceSid is required and must be a string",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!body.workflowName || typeof body.workflowName !== "string") {
    return new Response(
      JSON.stringify({
        error: "workflowName is required and must be a string",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!body.csvContent || typeof body.csvContent !== "string") {
    return new Response(
      JSON.stringify({
        error: "csvContent is required and must be a string",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function emit(chunk: string) {
        controller.enqueue(encoder.encode(chunk))
      }

      try {
        const { workflowSid, workflowName, totalFilters } =
          await createWorkflow(
            {
              workspaceSid: body.workspaceSid as string,
              workflowName: body.workflowName as string,
              csvContent: body.csvContent as string,
              accountSid: body.accountSid,
              authToken: body.authToken,
            },
            client,
            emit
          )

        emit(
          sseEvent(
            "success",
            `Concluído. Workflow "${workflowName}" criado com ${totalFilters} filtro(s).`,
            { done: true, workflowSid, workflowName, totalFilters }
          )
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        emit(sseEvent("error", message, { done: true }))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
