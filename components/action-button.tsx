import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Square,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"
import type { ComponentProps } from "react"

const ACTION_STYLES = {
  primary: "default",
  destructive: "destructive",
  search: "default",
  save: "default",
  add: "outline",
  cancel: "outline",
  stop: "outline",
  clear: "outline",
  export: "outline",
  refresh: "outline",
  copy: "outline",
  edit: "ghost",
  delete: "destructive",
  remove: "destructive",
} as const

type Action = keyof typeof ACTION_STYLES

const ACTION_ICONS: Partial<Record<Action, LucideIcon>> = {
  save: Save,
  add: Plus,
  cancel: X,
  stop: Square,
  clear: RotateCcw,
  export: Download,
  refresh: RotateCcw,
  edit: Pencil,
  delete: Trash2,
  remove: Trash2,
}

type ActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  "variant" | "size" | "asChild"
> & {
  action: Action
} & ({ iconOnly: true; "aria-label": string } | { iconOnly?: false })

export function ActionButton({
  action,
  iconOnly = false,
  type = "button",
  className,
  children,
  ...props
}: ActionButtonProps) {
  const Icon = ACTION_ICONS[action]

  return (
    <Button
      {...props}
      type={type}
      data-action={action}
      variant={ACTION_STYLES[action]}
      size={iconOnly ? "icon" : "default"}
      className={cn("gap-2 [&_svg]:size-3.5", className)}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </Button>
  )
}
