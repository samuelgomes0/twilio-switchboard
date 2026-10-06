import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export function NoEnvironmentSelected({ className }: { className?: string }) {
  const message = strings.common.noEnvironmentSelected

  return (
    <div
      role="status"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3.5 text-sm",
        className
      )}
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-warning">{message.title}</p>
        <p className="mt-0.5 text-warning/80">
          {message.message}{" "}
          <Link
            href="/settings/manage-environments"
            className="underline underline-offset-2 hover:text-warning focus-visible:outline-2 focus-visible:outline-ring"
          >
            {message.link}
          </Link>
        </p>
      </div>
    </div>
  )
}
