import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn("field-control", className)}
      {...props}
    />
  )
}
