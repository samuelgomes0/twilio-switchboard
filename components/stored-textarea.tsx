"use client"
import { navigateSuggestions } from "@/components/suggestion-keyboard"
import { useBrowserState } from "@/components/use-browser-state"

import { strings } from "@/lib/strings"
import { addVariable, deleteVariable, readVariables } from "@/lib/variables"

import { X } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface StoredTextareaProps {
  storageKey: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  rows?: number
}

export function StoredTextarea({
  storageKey,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
  rows = 4,
}: StoredTextareaProps) {
  const [saved, setSaved] = useBrowserState<string[]>(
    () => readVariables(storageKey),
    [],
    storageKey
  )

  const trimmed = value.trim()
  const isNew = trimmed.length > 0 && !saved.includes(trimmed)
  const showList = saved.length > 0 || isNew

  function saveValue(val: string) {
    const t = val.trim()
    if (!t) return
    setSaved(addVariable(storageKey, t))
  }

  function deleteValue(val: string) {
    setSaved(deleteVariable(storageKey, val))
  }

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        spellCheck={false}
        className={cn(
          "flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {showList && (
        <ul
          onKeyDown={navigateSuggestions}
          className="divide-y divide-border overflow-hidden rounded-md border border-border bg-popover"
        >
          {saved.map((s) => (
            <li key={s} className="group flex items-start gap-2 px-3 py-2">
              <button
                type="button"
                className="min-w-0 flex-1 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => onChange(s)}
              >
                <span className="line-clamp-2">{s}</span>
              </button>
              <button
                type="button"
                aria-label={strings.common.autocomplete.deleteValue}
                className="flex size-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => deleteValue(s)}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          {isNew && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => saveValue(trimmed)}
              >
                {strings.common.autocomplete.saveMessage}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
