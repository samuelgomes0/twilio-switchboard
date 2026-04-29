"use client"

import * as React from "react"
import { BookUser, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  addContact,
  deleteContact,
  readContacts,
  updateContact,
  type Contact,
} from "@/lib/contacts"
import { strings } from "@/lib/strings"

interface ContactFormState {
  name: string
  phone: string
}

const EMPTY_FORM: ContactFormState = { name: "", phone: "" }

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ContactFormState
  onSave: (data: ContactFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = React.useState<ContactFormState>(
    initial ?? EMPTY_FORM
  )
  const nameError = form.name.trim().length === 0
  const phoneError = form.phone.trim().length === 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nameError || phoneError) return
    onSave({ name: form.name.trim(), phone: form.phone.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">
            {strings.contacts.form.nameLabel}
          </Label>
          <Input
            id="contact-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={strings.contacts.form.namePlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">
            {strings.contacts.form.phoneLabel}
          </Label>
          <Input
            id="contact-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder={strings.contacts.form.phonePlaceholder}
            className="font-mono"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={nameError || phoneError}>
          {strings.contacts.form.saveButton}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
      </div>
    </form>
  )
}

export function ContactsManager() {
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    setContacts(readContacts())
  }, [])

  function handleAdd(data: ContactFormState) {
    const contact = addContact(data)
    setContacts((prev) => [contact, ...prev])
    setShowAddForm(false)
  }

  function handleUpdate(id: string, data: ContactFormState) {
    updateContact(id, data)
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    )
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteContact(id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/settings"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.environments.page.title}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {strings.contacts.manager.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <BookUser className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.contacts.manager.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {strings.contacts.manager.subtitle}
            </p>
          </div>
        </div>

        {!showAddForm && (
          <Button
            size="sm"
            onClick={() => {
              setShowAddForm(true)
              setEditingId(null)
            }}
            className="shrink-0 gap-1.5"
          >
            <Plus className="size-3.5" />
            {strings.contacts.manager.addButton}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold">
            {strings.contacts.manager.addTitle}
          </h2>
          <ContactForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <BookUser className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {strings.contacts.manager.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {strings.contacts.manager.emptyHint}{" "}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-primary hover:underline"
            >
              {strings.contacts.manager.emptyHintLink}
            </button>{" "}
            {strings.contacts.manager.emptyHintSuffix}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <div
                key={contact.id}
                className="rounded-xl border border-border bg-card px-5 py-5"
              >
                <h2 className="mb-4 text-sm font-semibold">
                  {strings.contacts.manager.editTitle}
                </h2>
                <ContactForm
                  initial={{ name: contact.name, phone: contact.phone }}
                  onSave={(data) => handleUpdate(contact.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : confirmDeleteId === contact.id ? (
              <div
                key={contact.id}
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4"
              >
                <p className="mb-3 text-sm font-medium text-destructive">
                  {strings.contacts.manager.deleteConfirm(contact.name)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(contact.id)}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    {strings.contacts.manager.deleteButton}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    {strings.common.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={contact.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {contact.phone}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Editar contato"
                    onClick={() => {
                      setEditingId(contact.id)
                      setShowAddForm(false)
                      setConfirmDeleteId(null)
                    }}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir contato"
                    onClick={() => {
                      setConfirmDeleteId(contact.id)
                      setEditingId(null)
                    }}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
