import { Filter, GitBranch, ListX, Search, User } from "lucide-react"

import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"

export const taskrouterTools: Tool[] = [
  {
    label: strings.taskrouter.workerManagement.title,
    description: strings.taskrouter.workerManagement.subtitle,
    href: "/taskrouter/manage-workers",
    icon: User,
    available: true,
  },
  {
    label: strings.taskrouter.searchTasks.breadcrumb,
    description: strings.taskrouter.searchTasks.subtitle,
    href: "/taskrouter/search-tasks-by-sid-or-number",
    icon: Search,
    available: true,
  },
  {
    label: strings.taskrouter.createWorkflow.breadcrumb,
    description: strings.taskrouter.createWorkflow.subtitle,
    href: "/taskrouter/create-workflow-from-csv",
    icon: GitBranch,
    available: true,
  },
  {
    label: strings.taskrouter.cancelQueueTasks.breadcrumb,
    description: strings.taskrouter.cancelQueueTasks.subtitle,
    href: "/taskrouter/cancel-queue-tasks-and-close-conversations",
    icon: ListX,
    available: true,
  },
  {
    label: strings.taskrouter.addParticularFilter.breadcrumb,
    description: strings.taskrouter.addParticularFilter.subtitle,
    href: "/taskrouter/add-business-rule-filter",
    icon: Filter,
    available: true,
  },
]
