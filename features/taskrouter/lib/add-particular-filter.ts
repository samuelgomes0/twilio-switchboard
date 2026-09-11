import { strings } from "@/lib/strings"
import { sanitizeExternalError } from "@/lib/errors"
import { sseEvent } from "@/features/conversations/lib/close"
import type { AddParticularFilterInput } from "@/features/taskrouter/types"
import { getTwilioClient } from "@/lib/twilio-client"

interface RoutingTarget {
  queue: string
  expression?: string
  skip_if?: string
}

interface WorkflowFilter {
  filter_friendly_name?: string
  friendly_name?: string
  expression?: string
  targets?: RoutingTarget[]
}

interface WorkflowConfiguration {
  task_routing: {
    filters: WorkflowFilter[]
    default_filter?: { queue: string }
  }
}

function buildFilter(filterName: string, taskQueueSid: string): WorkflowFilter {
  return {
    filter_friendly_name: filterName,
    expression: `regraDeNegocio IN ['${filterName}']`,
    targets: [
      {
        queue: taskQueueSid,
        expression: "worker.channel.chat.assigned_tasks==0",
        skip_if: "1==1",
      },
      {
        queue: taskQueueSid,
        expression: "worker.channel.chat.assigned_tasks<=1",
        skip_if: "1==1",
      },
      {
        queue: taskQueueSid,
        expression: "worker.channel.chat.assigned_tasks<=2",
        skip_if: "1==1",
      },
      {
        queue: taskQueueSid,
        expression: "worker.channel.chat.assigned_tasks<=3",
        skip_if: "1==1",
      },
      { queue: taskQueueSid },
    ],
  }
}

export async function addParticularFilter(
  input: AddParticularFilterInput,
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<{ totalAdded: number; totalSkipped: number; totalErrors: number }> {
  let totalAdded = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const { workflowSid, taskQueueSid } of input.entries) {
    emit(
      sseEvent(
        "info",
        strings.taskrouter.addParticularFilter.log.processing(workflowSid)
      )
    )

    try {
      const workflow = await client.taskrouter.v1
        .workspaces(input.workspaceSid)
        .workflows(workflowSid)
        .fetch()

      const configuration = JSON.parse(
        workflow.configuration
      ) as WorkflowConfiguration

      if (!configuration.task_routing) {
        emit(
          sseEvent(
            "error",
            strings.taskrouter.addParticularFilter.log.invalidRouting(
              workflowSid
            )
          )
        )
        totalErrors++
        continue
      }

      const filters: WorkflowFilter[] = configuration.task_routing.filters ?? []

      const alreadyExists = filters.some(
        (f) =>
          (f.filter_friendly_name ?? f.friendly_name ?? "").toLowerCase() ===
          input.filterName.toLowerCase()
      )

      if (alreadyExists) {
        emit(
          sseEvent(
            "warning",
            strings.taskrouter.addParticularFilter.log.alreadyExists(
              input.filterName,
              workflowSid
            )
          )
        )
        totalSkipped++
        continue
      }

      filters.push(buildFilter(input.filterName, taskQueueSid))
      configuration.task_routing.filters = filters

      await client.taskrouter.v1
        .workspaces(input.workspaceSid)
        .workflows(workflowSid)
        .update({ configuration: JSON.stringify(configuration) })

      emit(
        sseEvent(
          "success",
          strings.taskrouter.addParticularFilter.log.added(
            input.filterName,
            workflowSid
          )
        )
      )
      totalAdded++
    } catch (err) {
      const message = sanitizeExternalError(err)
      emit(
        sseEvent(
          "error",
          strings.taskrouter.addParticularFilter.log.failed(
            workflowSid,
            message
          )
        )
      )
      totalErrors++
    }
  }

  return { totalAdded, totalSkipped, totalErrors }
}
