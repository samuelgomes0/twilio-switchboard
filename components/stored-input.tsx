"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { navigateSuggestions } from "@/components/suggestion-keyboard"
import { X } from "lucide-react"
import * as React from "react"

import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { addVariable, deleteVariable, readVariables } from "@/lib/variables"

interface StoredInputProps {
  storageKey: string
  /** When provided, values are scoped to this environment (key becomes storageKey:environmentId) */
  environmentId?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Applied to the outer wrapper div (use for flex-1, w-full, etc.) */
  containerClassName?: string
  /** Applied to the inner <input> element */
  className?: string
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

export function StoredInput({
  storageKey,
  environmentId,
  value,
  onChange,
  placeholder,
  disabled,
  containerClassName,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: StoredInputProps) {
  const effectiveKey = environmentId
    ? `${storageKey}:${environmentId}`
    : storageKey
  const [saved, setSaved] = useBrowserState<string[]>(
    () => readVariables(effectiveKey),
    [],
    effectiveKey
  )
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const trimmed = value.trim()
  const filtered = trimmed
    ? saved.filter((s) => s.toLowerCase().includes(trimmed.toLowerCase()))
    : saved
  const isNew = trimmed.length > 0 && !saved.includes(trimmed)
  const showDropdown = open && (filtered.length > 0 || isNew)

  function saveValue(val: string) {
    const t = val.trim()
    if (!t) return
    setSaved(addVariable(effectiveKey, t))
  }

  function deleteValue(val: string) {
    setSaved(deleteVariable(effectiveKey, val))
  }

  function handleBlur(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setOpen(false)
  }

  function handleSelect(val: string) {
    onChange(val)
    setOpen(false)
  }

  function handleSaveNew() {
    saveValue(trimmed)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", containerClassName)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false)
          event.stopPropagation()
        } else if (showDropdown) navigateSuggestions(event)
      }}
    >
      <input
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "field-control font-mono placeholder:font-sans",
          className
        )}
      />
      {showDropdown && (
        <ul className="absolute top-full left-0 z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md">
          {filtered.map((s) => (
            <li key={s} className="group flex items-center">
              <button
                type="button"
                tabIndex={0}
                className="min-w-0 flex-1 px-3 py-2.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  handleSelect(s)
                }}
              >
                <span className="block truncate">{s}</span>
              </button>
              <button
                type="button"
                tabIndex={0}
                aria-label={strings.common.autocomplete.deleteValue}
                className="mr-1 flex size-9 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  deleteValue(s)
                }}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          {isNew && (
            <li>
              <button
                type="button"
                tabIndex={0}
                className="w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  handleSaveNew()
                }}
              >
                {strings.common.autocomplete.saveValue(trimmed)}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
