"use client"

import { X } from "lucide-react"
import * as React from "react"

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
  const [saved, setSaved] = React.useState<string[]>([])

  React.useEffect(() => {
    setSaved(readSaved(storageKey))
  }, [storageKey])

  const trimmed = value.trim()
  const isNew = trimmed.length > 0 && !saved.includes(trimmed)
  const showList = saved.length > 0 || isNew

  function saveValue(val: string) {
    const t = val.trim()
    if (!t) return
    setSaved((prev) => {
      const next = [t, ...prev.filter((s) => s !== t)].slice(0, MAX_SAVED)
      writeSaved(storageKey, next)
      return next
    })
  }

  function deleteValue(val: string) {
    setSaved((prev) => {
      const next = prev.filter((s) => s !== val)
      writeSaved(storageKey, next)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        spellCheck={false}
        className={cn(
          "flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {showList && (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-popover">
          {saved.map((s) => (
            <li key={s} className="group flex items-start gap-2 px-3 py-2">
              <button
                type="button"
                className="min-w-0 flex-1 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onChange(s)}
              >
                <span className="line-clamp-2">{s}</span>
              </button>
              <button
                type="button"
                aria-label="Remover"
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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
                className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => saveValue(trimmed)}
              >
                + Salvar mensagem atual
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
