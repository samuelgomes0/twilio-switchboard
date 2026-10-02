"use client"
import { ClipboardButton } from "@/components/clipboard-button"
import { JsonBlock } from "@/components/json-block"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SearchTaskResult } from "@/features/taskrouter/types"
import { strings } from "@/lib/strings"
function formatDate(d: Date | null | string): string {
  if (!d) return strings.common.notAvailable
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatAge(sec: number): string {
  if (sec < 60) return strings.taskrouter.searchTasks.duration.seconds(sec)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return strings.taskrouter.searchTasks.duration.minutes(m, s)
  const h = Math.floor(m / 60)
  return strings.taskrouter.searchTasks.duration.hours(h, m % 60)
}

type BadgeVariant =
  "success" | "warning" | "destructive" | "secondary" | "info" | "outline"

function statusVariant(s: string): BadgeVariant {
  if (s === "assigned") return "success"
  if (s === "reserved") return "info"
  if (s === "pending") return "warning"
  if (s === "wrapping") return "warning"
  if (s === "canceled") return "destructive"
  if (s === "completed") return "secondary"
  return "outline"
}

function channelLabel(channel: "whatsapp" | "voice" | "unknown"): string {
  if (channel === "whatsapp")
    return strings.taskrouter.searchTasks.result.channelWhatsapp
  if (channel === "voice")
    return strings.taskrouter.searchTasks.result.channelVoice
  return strings.taskrouter.searchTasks.result.channelUnknown
}

function channelVariant(
  channel: "whatsapp" | "voice" | "unknown"
): BadgeVariant {
  if (channel === "whatsapp") return "success"
  if (channel === "voice") return "info"
  return "outline"
}

export function TaskCard({ task }: { task: SearchTaskResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="font-mono text-sm leading-relaxed break-all">
              {task.sid}
            </CardTitle>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <ClipboardButton
              value={task.sid}
              label={strings.taskrouter.searchTasks.result.copySid}
              copiedLabel={strings.taskrouter.searchTasks.result.sidCopied}
            />
            {task.channel !== "unknown" && (
              <Badge variant={channelVariant(task.channel)}>
                {channelLabel(task.channel)}
              </Badge>
            )}
            <Badge variant={statusVariant(task.assignmentStatus)}>
              {task.assignmentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.priority}
            </p>
            <p className="font-medium">{task.priority}</p>
          </div>
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.age}
            </p>
            <p className="font-medium">{formatAge(task.age)}</p>
          </div>
          {task.workflowFriendlyName && (
            <div>
              <p className="mb-0.5 text-muted-foreground">
                {strings.taskrouter.searchTasks.result.workflow}
              </p>
              <p className="font-medium">{task.workflowFriendlyName}</p>
            </div>
          )}
          {task.taskQueueFriendlyName && (
            <div>
              <p className="mb-0.5 text-muted-foreground">
                {strings.taskrouter.searchTasks.result.queue}
              </p>
              <p className="font-medium">{task.taskQueueFriendlyName}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
          <div>
            <p className="mb-0.5 text-muted-foreground">
              {strings.taskrouter.searchTasks.result.dateCreated}
            </p>
            <p className="font-medium">{formatDate(task.dateCreated)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {strings.taskrouter.searchTasks.result.attributes}
          </p>
          <JsonBlock
            value={task.attributes}
            className="max-h-64 overflow-x-auto overflow-y-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap"
          />
        </div>
      </CardContent>
    </Card>
  )
}
