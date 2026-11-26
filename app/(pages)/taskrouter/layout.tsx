import type { ReactNode } from "react"
import { TaskrouterWorkspaceProvider } from "@/features/taskrouter/components/workspace-context"

export default function TaskrouterLayout({
  children,
}: {
  children: ReactNode
}) {
  return <TaskrouterWorkspaceProvider>{children}</TaskrouterWorkspaceProvider>
}
