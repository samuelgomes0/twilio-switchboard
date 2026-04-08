"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

export function MaskedToken({ token }: { token: string }) {
  const [visible, setVisible] = React.useState(false)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs">
        {visible ? token : "••••••••••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Ocultar token" : "Revelar token"}
      >
        {visible ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </button>
    </span>
  )
}
