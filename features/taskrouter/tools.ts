import { Search, User } from "lucide-react"

import { strings } from "@/lib/strings"
import type { Tool } from "@/lib/tool"

export const taskrouterTools: Tool[] = [
  {
    label: strings.taskrouter.searchTasks.breadcrumb,
    description: strings.taskrouter.searchTasks.subtitle,
    href: "/taskrouter/search-tasks-by-sid-or-number",
    icon: Search,
    available: true,
  },
  {
    label: strings.taskrouter.workerManagement.title,
    description: strings.taskrouter.workerManagement.subtitle,
    href: "/taskrouter/manage-workers",
    icon: User,
    available: true,
  },
]
