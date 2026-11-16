import type { ReactNode } from "react"

export function InputActions({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="input-actions"
      className="flex flex-col gap-2 lg:flex-row lg:items-start [&>[data-slot=action-bar]]:shrink-0"
    >
      {children}
    </div>
  )
}
