import { TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { strings } from "@/lib/strings"

export function WarningBadge() {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Badge variant="warning" className="cursor-default gap-1">
            <TriangleAlert className="size-3" />
            {strings.common.warningBadge.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{strings.common.warningBadge.tooltip}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}
