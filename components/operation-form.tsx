import { FormActions } from "@/components/form-actions"
import { cn } from "@/lib/utils"
import type { ComponentProps, ReactNode } from "react"

type OperationFormProps = ComponentProps<"form"> & {
  actions: ReactNode
  bodyClassName?: string
}

export function OperationForm({
  children,
  actions,
  className,
  bodyClassName,
  ...props
}: OperationFormProps) {
  return (
    <form
      data-slot="operation-form"
      className={cn("operation-form", className)}
      {...props}
    >
      <div className={cn("operation-form-body", bodyClassName)}>{children}</div>
      <FormActions>{actions}</FormActions>
    </form>
  )
}
