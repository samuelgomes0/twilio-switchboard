import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("field-control min-h-28 resize-y py-3", className)}
      {...props}
    />
  )
}
