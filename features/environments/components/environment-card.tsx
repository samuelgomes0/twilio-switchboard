"use client"

import { Check, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { type TwilioEnvironment } from "@/features/environments/storage"
import { STORED_KEY_LABELS, STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { MaskedToken } from "@/features/environments/components/masked-token"

type StoredKeyName = keyof typeof STORED_KEYS

const SCOPED_FIELDS: { key: StoredKeyName; label: string }[] = (
  Object.keys(STORED_KEYS) as StoredKeyName[]
)
  .filter((k) => k !== "closeMessages")
  .map((k) => ({ key: k, label: STORED_KEY_LABELS[k] }))

function readScoped(baseKey: string, envId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(`${baseKey}:${envId}`)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function truncate(value: string, max = 34): string {
  return value.length > max ? value.slice(0, max) + "…" : value
}

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
  const [savedValues, setSavedValues] = React.useState<
    { label: string; values: string[] }[]
  >([])

  React.useEffect(() => {
    const groups = SCOPED_FIELDS.map(({ key, label }) => ({
      label,
      values: readScoped(STORED_KEYS[key], env.id),
    })).filter((g) => g.values.length > 0)

    setSavedValues(groups)
  }, [env.id])

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
                {strings.environments.card.active}
              </span>
            )}
          </div>
          <div className="space-y-0.5 pl-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-16 shrink-0">{strings.environments.card.accountSidLabel}</span>
              <span className="truncate font-mono">{env.accountSid}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-16 shrink-0">{strings.environments.card.authTokenLabel}</span>
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
              {strings.environments.card.selectButton}
            </Button>
          )}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onEdit}
            aria-label={strings.environments.card.editAriaLabel}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onDelete}
            aria-label={strings.environments.card.deleteAriaLabel}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Saved values per group */}
      {savedValues.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {savedValues.map(({ label, values }) => (
            <div key={label}>
              <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
              </p>
              <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <span
                    key={v}
                    title={v}
                    className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {truncate(v)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
