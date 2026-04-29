"use client"

import * as React from "react"
import { ChevronRight, Settings2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useEnvironment } from "@/features/environments/context"
import {
  EnvironmentForm,
  type FormState,
} from "@/features/environments/components/environment-form"
import { EnvironmentCard } from "@/features/environments/components/environment-card"
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
          {strings.environments.manager.breadcrumb}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.environments.manager.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {strings.environments.manager.subtitle}
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
            {strings.environments.manager.addButton}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-card px-5 py-5">
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
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <Settings2 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {strings.environments.manager.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {strings.environments.manager.emptyHint}{" "}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-primary hover:underline"
            >
              {strings.environments.manager.emptyHintLink}
            </button>{" "}
            {strings.environments.manager.emptyHintSuffix}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {environments.map((env) =>
            editingId === env.id ? (
              <div
                key={env.id}
                className="rounded-xl border border-border bg-card px-5 py-5"
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
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4"
              >
                <p className="mb-3 text-sm font-medium text-destructive">
                  {strings.environments.manager.deleteConfirm(env.name)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(env.id)}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    {strings.environments.manager.deleteButton}
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
