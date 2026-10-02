"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { Check, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MaskedToken } from "@/features/environments/components/masked-token"
import { type TwilioEnvironment } from "@/features/environments/storage"
import { STORED_KEY_LABELS, STORED_KEYS } from "@/lib/stored-keys"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { readVariables } from "@/lib/variables"

type StoredKeyName = keyof typeof STORED_KEYS

const SCOPED_FIELDS: { key: StoredKeyName; label: string }[] = (
  Object.keys(STORED_KEYS) as StoredKeyName[]
)
  .filter((k) => k !== "closeMessages")
  .map((k) => ({ key: k, label: STORED_KEY_LABELS[k] }))

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
  const [savedValues] = useBrowserState<{ label: string; values: string[] }[]>(
    () =>
      SCOPED_FIELDS.map(({ key, label }) => ({
        label,
        values: readVariables(`${STORED_KEYS[key]}:${env.id}`),
      })).filter((group) => group.values.length > 0),
    [],
    env.id
  )

  return (
    <div
      className={cn(
        "environment-row rounded-md border px-5 py-5 transition-colors",
        isActive ? "border-input bg-muted" : "border-border bg-card"
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 xl:flex-row">
        <div className="w-full min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isActive && (
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            )}
            <span className="text-base font-semibold break-words">
              {env.name}
            </span>
            {isActive && (
              <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success dark:text-success">
                {strings.environments.card.active}
              </span>
            )}
          </div>
          <div className="space-y-0.5 pl-0">
            <div className="credential-row text-xs text-muted-foreground">
              <span className="w-16 shrink-0">
                {strings.environments.card.accountSidLabel}
              </span>
              <span className="min-w-0 font-mono break-all">
                {env.accountSid}
              </span>
            </div>
            <div className="credential-row text-xs text-muted-foreground">
              <span className="w-16 shrink-0">
                {strings.environments.card.authTokenLabel}
              </span>
              <MaskedToken token={env.authToken} />
            </div>
          </div>
        </div>

        <ActionBar>
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
          <ActionButton
            action="edit"
            iconOnly
            onClick={onEdit}
            aria-label={strings.environments.card.editAriaLabel}
          />
          <ActionButton
            action="delete"
            iconOnly
            onClick={onDelete}
            aria-label={strings.environments.card.deleteAriaLabel}
          />
        </ActionBar>
      </div>

      {/* Saved values per group */}
      {savedValues.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {savedValues.map(({ label, values }) => (
            <div key={label}>
              <p className="mb-1 text-xs font-semibold tracking-normal text-muted-foreground">
                {label}
              </p>
              <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <span
                    key={v}
                    title={v}
                    className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
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
