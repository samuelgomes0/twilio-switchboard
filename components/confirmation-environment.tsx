"use client"

import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"

export function ConfirmationEnvironment() {
  const { activeEnvironment } = useEnvironment()
  return (
    <p className="text-sm break-words">
      {strings.sidebar.environment}:{" "}
      <strong>
        {activeEnvironment?.name ?? strings.sidebar.noEnvironment}
      </strong>
    </p>
  )
}
