"use client"
import { EmptyState } from "@/components/empty-state"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import * as React from "react"

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
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
          <InputActions>
            <div className="min-w-0 flex-1">
              <Input
                id="contact-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder={strings.contacts.form.phonePlaceholder}
                className="font-mono"
              />
            </div>
            <ActionBar>
              <ActionButton
                action="save"
                type="submit"
                disabled={nameError || phoneError}
              >
                {strings.contacts.form.saveButton}
              </ActionButton>
              <ActionButton action="cancel" type="button" onClick={onCancel}>
                {strings.common.cancel}
              </ActionButton>
            </ActionBar>
          </InputActions>
        </div>
      </div>
    </form>
  )
}

export function ContactsManager() {
  const [contacts, setContacts] = useBrowserState<Contact[]>(readContacts, [])
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  )

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
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.contacts.manager.title}
        description={strings.contacts.manager.subtitle}
        parent={{ href: "/settings", label: strings.environments.page.title }}
        actions={
          !showAddForm && (
            <ActionButton
              action="add"
              onClick={() => {
                setShowAddForm(true)
                setEditingId(null)
              }}
            >
              {strings.contacts.manager.addButton}
            </ActionButton>
          )
        }
      />

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-md border border-border bg-card px-5 py-5">
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
        <EmptyState title={strings.contacts.manager.emptyTitle}>
          <p className="text-sm text-muted-foreground">
            {strings.contacts.manager.emptyHint}
          </p>
          <ActionButton
            action="add"
            className="mt-4"
            onClick={() => setShowAddForm(true)}
          >
            {strings.contacts.manager.addButton}
          </ActionButton>
        </EmptyState>
      ) : (
        <div className="settings-list">
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <div
                key={contact.id}
                className="rounded-md border border-border bg-card px-5 py-5"
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
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4"
              >
                <p className="mb-3 text-sm font-medium text-destructive">
                  {strings.contacts.manager.deleteConfirm(contact.name)}
                </p>
                <ActionBar className="justify-end">
                  <ActionButton
                    action="cancel"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    {strings.common.cancel}
                  </ActionButton>
                  <ActionButton
                    action="delete"
                    onClick={() => handleDelete(contact.id)}
                  >
                    {strings.contacts.manager.deleteButton}
                  </ActionButton>
                </ActionBar>
              </div>
            ) : (
              <div key={contact.id} className="settings-row">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {contact.phone}
                  </p>
                </div>
                <ActionBar>
                  <ActionButton
                    action="edit"
                    iconOnly
                    type="button"
                    aria-label={strings.contacts.manager.editTitle}
                    onClick={() => {
                      setEditingId(contact.id)
                      setShowAddForm(false)
                      setConfirmDeleteId(null)
                    }}
                  />
                  <ActionButton
                    action="delete"
                    iconOnly
                    type="button"
                    aria-label={strings.contacts.manager.deleteAriaLabel}
                    onClick={() => {
                      setConfirmDeleteId(contact.id)
                      setEditingId(null)
                    }}
                  />
                </ActionBar>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
