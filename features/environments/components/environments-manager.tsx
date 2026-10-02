"use client"
import { EmptyState } from "@/components/empty-state"

import { PageHeader } from "@/components/page-header"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import * as React from "react"

import { EnvironmentCard } from "@/features/environments/components/environment-card"
import {
  EnvironmentForm,
  type FormState,
} from "@/features/environments/components/environment-form"
import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"

export function EnvironmentsManager() {
  const {
    environments,
    activeEnvironment,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActive,
  } = useEnvironment()

  const [showAddForm, setShowAddForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  )

  function handleAdd(form: FormState) {
    addEnvironment(form)
    setShowAddForm(false)
  }

  function handleUpdate(id: string, form: FormState) {
    updateEnvironment(id, form)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteEnvironment(id)
    setConfirmDeleteId(null)
  }

  return (
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={strings.environments.manager.title}
        description={strings.environments.manager.subtitle}
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
              {strings.environments.manager.addButton}
            </ActionButton>
          )
        }
      />

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-md border border-border bg-card px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold">
            {strings.environments.manager.addTitle}
          </h2>
          <EnvironmentForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Environment list */}
      {environments.length === 0 && !showAddForm ? (
        <EmptyState title={strings.environments.manager.emptyTitle}>
          <p className="text-sm text-muted-foreground">
            {strings.environments.manager.emptyHint}
          </p>
          <ActionButton
            action="add"
            className="mt-4"
            onClick={() => setShowAddForm(true)}
          >
            {strings.environments.manager.addButton}
          </ActionButton>
        </EmptyState>
      ) : (
        <div className="settings-list">
          {environments.map((env) =>
            editingId === env.id ? (
              <div
                key={env.id}
                className="rounded-md border border-border bg-card px-5 py-5"
              >
                <h2 className="mb-4 text-sm font-semibold">
                  {strings.environments.manager.editTitle}
                </h2>
                <EnvironmentForm
                  initial={{
                    name: env.name,
                    accountSid: env.accountSid,
                    authToken: env.authToken,
                  }}
                  onSave={(form) => handleUpdate(env.id, form)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : confirmDeleteId === env.id ? (
              <div
                key={env.id}
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4"
              >
                <p className="mb-3 text-sm font-medium text-destructive">
                  {strings.environments.manager.deleteConfirm(env.name)}
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
                    onClick={() => handleDelete(env.id)}
                  >
                    {strings.environments.manager.deleteButton}
                  </ActionButton>
                </ActionBar>
              </div>
            ) : (
              <EnvironmentCard
                key={env.id}
                env={env}
                isActive={activeEnvironment?.id === env.id}
                onSelect={() => setActive(env.id)}
                onEdit={() => {
                  setEditingId(env.id)
                  setShowAddForm(false)
                  setConfirmDeleteId(null)
                }}
                onDelete={() => {
                  setConfirmDeleteId(env.id)
                  setEditingId(null)
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
