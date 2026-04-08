"use client"

import { Check, CheckCircle2, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type TwilioEnvironment } from "@/features/environments/storage"
import { MaskedToken } from "@/features/environments/components/masked-token"

export function EnvironmentCard({
  env,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  env: TwilioEnvironment
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 transition-colors",
        isActive ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {isActive && (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
            )}
            <span className="truncate text-sm font-medium">{env.name}</span>
            {isActive && (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ativo
              </span>
            )}
          </div>
          <div className="space-y-0.5 pl-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-16 shrink-0">Account SID</span>
              <span className="truncate font-mono">{env.accountSid}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-16 shrink-0">Auth Token</span>
              <MaskedToken token={env.authToken} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isActive && (
            <Button
              size="xs"
              variant="outline"
              onClick={onSelect}
              className="gap-1"
            >
              <Check className="size-3" />
              Selecionar
            </Button>
          )}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onEdit}
            aria-label="Editar ambiente"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onDelete}
            aria-label="Excluir ambiente"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
