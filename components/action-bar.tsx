import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

export function ActionBar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="action-bar"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}
