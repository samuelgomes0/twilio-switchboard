import { ClipboardList, GitBranch, ListX, User, UserPlus } from "lucide-react"
import { ElementType } from "react"

import { strings } from "@/lib/strings"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const taskrouterTools: Tool[] = [
  {
    label: strings.taskrouter.assignWorkers.breadcrumb,
    description: strings.taskrouter.assignWorkers.subtitle,
    href: "/taskrouter/assign-workers",
    icon: UserPlus,
    available: true,
  },
  {
    label: strings.taskrouter.createWorkflow.breadcrumb,
    description: strings.taskrouter.createWorkflow.subtitle,
    href: "/taskrouter/create-workflow",
    icon: GitBranch,
    available: true,
  },
  {
    label: strings.taskrouter.fetchTask.breadcrumb,
    description: strings.taskrouter.fetchTask.subtitle,
    href: "/taskrouter/fetch-task",
    icon: ClipboardList,
    available: true,
  },
  {
    label: strings.taskrouter.fetchWorker.breadcrumb,
    description: strings.taskrouter.fetchWorker.subtitle,
    href: "/taskrouter/fetch-worker",
    icon: User,
    available: true,
  },
  {
    label: strings.taskrouter.cancelQueueTasks.breadcrumb,
    description: strings.taskrouter.cancelQueueTasks.subtitle,
    href: "/taskrouter/cancel-queue-tasks",
    icon: ListX,
    available: true,
  },
]
