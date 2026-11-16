"use client"

import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

import { Eye, EyeOff } from "lucide-react"
import * as React from "react"

export function MaskedToken({ token }: { token: string }) {
  const [visible, setVisible] = React.useState(false)
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="min-w-0 font-mono text-xs break-all">
        {visible ? token : "••••••••••••••••"}
      </span>
      <Button
        size="icon-xs"
        variant="ghost"
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground"
        aria-label={
          visible
            ? strings.environments.form.hideTokenAriaLabel
            : strings.environments.form.showTokenAriaLabel
        }
      >
        {visible ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </Button>
    </span>
  )
}
