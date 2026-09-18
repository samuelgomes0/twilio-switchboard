import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

export function NoEnvironmentSelected({ className }: { className?: string }) {
  const message = strings.common.noEnvironmentSelected

  return (
    <div
      role="status"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium text-destructive">{message.title}</p>
        <p className="mt-0.5 text-destructive/80">
          {message.message}{" "}
          <Link
            href="/settings/environments"
            className="underline underline-offset-2 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
          >
            {message.link}
          </Link>
        </p>
      </div>
    </div>
  )
}
