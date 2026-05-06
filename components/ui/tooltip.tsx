import * as React from "react"
import { Tooltip } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider(props: React.ComponentProps<typeof Tooltip.Provider>) {
  return <Tooltip.Provider delayDuration={300} {...props} />
}

function TooltipRoot(props: React.ComponentProps<typeof Tooltip.Root>) {
  return <Tooltip.Root {...props} />
}

function TooltipTrigger(props: React.ComponentProps<typeof Tooltip.Trigger>) {
  return <Tooltip.Trigger {...props} />
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Tooltip.Content>) {
  return (
    <Tooltip.Portal>
      <Tooltip.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </Tooltip.Portal>
  )
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
