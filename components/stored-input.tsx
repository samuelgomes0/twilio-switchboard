"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

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
}

const MAX_SAVED = 10

function readSaved(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeSaved(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch {}
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
}: StoredInputProps) {
  const effectiveKey = environmentId ? `${storageKey}:${environmentId}` : storageKey
  const [saved, setSaved] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setSaved(readSaved(effectiveKey))
  }, [effectiveKey])

  const trimmed = value.trim()
  const filtered = trimmed
    ? saved.filter((s) => s.toLowerCase().includes(trimmed.toLowerCase()))
    : saved
  const isNew = trimmed.length > 0 && !saved.includes(trimmed)
  const showDropdown = open && (filtered.length > 0 || isNew)

  function saveValue(val: string) {
    const t = val.trim()
    if (!t) return
    setSaved((prev) => {
      const next = [t, ...prev.filter((s) => s !== t)].slice(0, MAX_SAVED)
      writeSaved(effectiveKey, next)
      return next
    })
  }

  function deleteValue(val: string) {
    setSaved((prev) => {
      const next = prev.filter((s) => s !== val)
      writeSaved(effectiveKey, next)
      return next
    })
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
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-xs shadow-xs transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
                className="min-w-0 flex-1 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(s)
                }}
              >
                <span className="block truncate">{s}</span>
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Remover"
                className="mr-1 flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                onMouseDown={(e) => {
                  e.preventDefault()
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
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSaveNew()
                }}
              >
                + Salvar &ldquo;{trimmed}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
