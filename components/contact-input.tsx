"use client"

import * as React from "react"
import { Check, UserPlus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  addContact,
  deleteContact,
  readContacts,
  type Contact,
} from "@/lib/contacts"

interface ContactInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  containerClassName?: string
  className?: string
  id?: string
  /** Text shown as a visual prefix overlay inside the input (e.g. "whatsapp:+55") */
  prefix?: string
}

export function ContactInput({
  value,
  onChange,
  placeholder,
  disabled,
  containerClassName,
  className,
  id,
  prefix,
}: ContactInputProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [open, setOpen] = React.useState(false)
  const [showSaveForm, setShowSaveForm] = React.useState(false)
  const [savingName, setSavingName] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const saveInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setContacts(readContacts())
  }, [])

  const trimmed = value.trim()
  const filtered = trimmed
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          c.phone.includes(trimmed)
      )
    : contacts
  const exactMatch = contacts.some((c) => c.phone === trimmed)
  const canSave = trimmed.length > 0 && !exactMatch
  const showDropdown = open && (filtered.length > 0 || canSave)

  function handleSelect(phone: string) {
    onChange(phone)
    setOpen(false)
    setShowSaveForm(false)
  }

  function handleDelete(contactId: string) {
    deleteContact(contactId)
    setContacts((prev) => prev.filter((c) => c.id !== contactId))
  }

  function handleSave() {
    if (!trimmed || !savingName.trim()) return
    const contact = addContact({ name: savingName.trim(), phone: trimmed })
    setContacts((prev) => [contact, ...prev])
    setSavingName("")
    setShowSaveForm(false)
    setOpen(false)
  }

  function handleBlur(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setOpen(false)
    setShowSaveForm(false)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", containerClassName)}
      onBlur={handleBlur}
    >
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
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
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-sm shadow-xs transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
      {showDropdown && (
        <ul className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md">
          {filtered.map((c) => (
            <li key={c.id} className="group flex items-center">
              <button
                type="button"
                tabIndex={0}
                className="min-w-0 flex-1 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(c.phone)
                }}
              >
                <span className="block truncate text-sm font-medium">
                  {c.name}
                </span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {c.phone}
                </span>
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Remover contato"
                className="mr-1 flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleDelete(c.id)
                }}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          {canSave && !showSaveForm && (
            <li>
              <button
                type="button"
                tabIndex={0}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setShowSaveForm(true)
                  setTimeout(() => saveInputRef.current?.focus(), 0)
                }}
              >
                <UserPlus className="size-3 shrink-0" />
                Salvar &ldquo;{trimmed}&rdquo; como contato
              </button>
            </li>
          )}
          {canSave && showSaveForm && (
            <li className="px-3 py-2">
              <div className="flex gap-1.5">
                <input
                  ref={saveInputRef}
                  type="text"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSave()
                    }
                    if (e.key === "Escape") {
                      setShowSaveForm(false)
                      setSavingName("")
                    }
                  }}
                  placeholder="Nome do contato"
                  className="h-7 flex-1 rounded border border-input bg-transparent px-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                />
                <button
                  type="button"
                  disabled={!savingName.trim()}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSave()
                  }}
                  className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="size-3" />
                </button>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
