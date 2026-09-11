"use client"

import * as React from "react"
import {
  ChevronRight,
  Pencil,
  Plus,
  Settings2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import {
  addVariable,
  deleteVariable,
  readVariables,
  updateVariable,
  VARIABLE_GROUPS,
  type VariableGroup,
} from "@/lib/variables"
import { strings } from "@/lib/strings"

const s = strings.variables.manager

interface GroupState {
  values: string[]
  showAdd: boolean
  addValue: string
  editingIndex: number | null
  editValue: string
  confirmDeleteIndex: number | null
}

function initGroup(key: string, environmentId: string): GroupState {
  return {
    values: readVariables(key, environmentId),
    showAdd: false,
    addValue: "",
    editingIndex: null,
    editValue: "",
    confirmDeleteIndex: null,
  }
}

function VariableGroupSection({
  group,
  environmentId,
}: {
  group: VariableGroup
  environmentId: string
}) {
  const [state, setState] = React.useState<GroupState>(() =>
    initGroup(group.key, environmentId)
  )

  React.useEffect(() => {
    setState(initGroup(group.key, environmentId))
  }, [group.key, environmentId])

  function set(patch: Partial<GroupState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function handleAdd() {
    if (!state.addValue.trim()) return
    const next = addVariable(group.key, state.addValue, environmentId)
    set({ values: next, addValue: "", showAdd: false })
  }

  function handleUpdate(index: number) {
    if (!state.editValue.trim()) return
    const old = state.values[index]
    const next = updateVariable(group.key, old, state.editValue, environmentId)
    set({ values: next, editingIndex: null, editValue: "" })
  }

  function handleDelete(index: number) {
    const val = state.values[index]
    const next = deleteVariable(group.key, val, environmentId)
    set({ values: next, confirmDeleteIndex: null })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">{group.label}</span>
        {!state.showAdd && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() =>
              set({
                showAdd: true,
                editingIndex: null,
                confirmDeleteIndex: null,
              })
            }
          >
            <Plus className="size-3" />
            {s.addButton}
          </Button>
        )}
      </div>

      <div className="px-4 py-3">
        {state.showAdd && (
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <Label className="text-xs">{s.valueLabel}</Label>
            <div className="flex gap-2">
              <Input
                className="h-8 font-mono text-xs"
                value={state.addValue}
                onChange={(e) => set({ addValue: e.target.value })}
                placeholder={s.valuePlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                  if (e.key === "Escape") set({ showAdd: false, addValue: "" })
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={handleAdd}
                disabled={!state.addValue.trim()}
              >
                {s.saveButton}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => set({ showAdd: false, addValue: "" })}
              >
                {strings.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {state.values.length === 0 && !state.showAdd ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            {s.emptyHint}
          </p>
        ) : (
          <div className="space-y-1">
            {state.values.map((val, i) =>
              state.editingIndex === i ? (
                <div key={i} className="flex gap-2">
                  <Input
                    className="h-8 font-mono text-xs"
                    value={state.editValue}
                    onChange={(e) => set({ editValue: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(i)
                      if (e.key === "Escape")
                        set({ editingIndex: null, editValue: "" })
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => handleUpdate(i)}
                    disabled={!state.editValue.trim()}
                  >
                    {s.saveButton}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    onClick={() => set({ editingIndex: null, editValue: "" })}
                  >
                    {strings.common.cancel}
                  </Button>
                </div>
              ) : state.confirmDeleteIndex === i ? (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  <p className="flex-1 truncate font-mono text-xs text-destructive">
                    {s.deleteConfirm(val)}
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 shrink-0 gap-1 px-2 text-xs"
                    onClick={() => handleDelete(i)}
                  >
                    <Trash2 className="size-3" />
                    {s.deleteButton}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => set({ confirmDeleteIndex: null })}
                  >
                    {strings.common.cancel}
                  </Button>
                </div>
              ) : (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {val}
                  </span>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={strings.variables.manager.editAriaLabel}
                      onClick={() =>
                        set({
                          editingIndex: i,
                          editValue: val,
                          showAdd: false,
                          confirmDeleteIndex: null,
                        })
                      }
                      className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={strings.variables.manager.deleteAriaLabel}
                      onClick={() =>
                        set({ confirmDeleteIndex: i, editingIndex: null })
                      }
                      className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function VariablesManager() {
  const { activeEnvironment } = useEnvironment()

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/settings"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {strings.environments.page.title}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">{s.breadcrumb}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <SlidersHorizontal className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </div>
      </div>

      {!activeEnvironment ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <SlidersHorizontal className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {strings.common.noEnvironmentSelected.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {strings.common.noEnvironmentSelected.message}
          </p>
          <Link
            href="/settings/environments"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Settings2 className="size-3" />
            {strings.common.noEnvironmentSelected.link}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {s.environmentLabel}{" "}
            <span className="font-medium text-foreground">
              {activeEnvironment.name}
            </span>
          </p>
          <div className="space-y-4">
            {VARIABLE_GROUPS.map((group) => (
              <VariableGroupSection
                key={group.key}
                group={group}
                environmentId={activeEnvironment.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
