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
          href="/environments"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Configurações
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">Gerenciar Ambientes</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Ambientes Twilio
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as credenciais de cada ambiente
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
            Novo ambiente
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold">Novo ambiente</h2>
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
            Nenhum ambiente cadastrado
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clique em{" "}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-primary hover:underline"
            >
              Novo ambiente
            </button>{" "}
            para começar
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
                <h2 className="mb-4 text-sm font-semibold">Editar ambiente</h2>
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
                  Excluir &ldquo;{env.name}&rdquo;? Esta ação não pode ser
                  desfeita.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(env.id)}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    Confirmar exclusão
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancelar
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
