import { ActionBar } from "@/components/action-bar"
import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <ActionBar
      data-form-actions="true"
      className={cn("form-actions", className)}
      {...props}
    />
  )
}
