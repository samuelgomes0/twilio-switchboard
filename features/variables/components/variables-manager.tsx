"use client"
import { useBrowserState } from "@/components/use-browser-state"

import { PageHeader } from "@/components/page-header"

import { ActionBar } from "@/components/action-bar"
import { InputActions } from "@/components/input-actions"

import { ActionButton } from "@/components/action-button"

import { NoEnvironmentSelected } from "@/components/no-environment-selected"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"
import { strings } from "@/lib/strings"
import {
  addVariable,
  deleteVariable,
  readVariables,
  updateVariable,
  VARIABLE_GROUPS,
  type VariableGroup,
} from "@/lib/variables"

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
  const [state, setState] = useBrowserState<GroupState>(
    () => initGroup(group.key, environmentId),
    {
      values: [],
      showAdd: false,
      addValue: "",
      editingIndex: null,
      editValue: "",
      confirmDeleteIndex: null,
    },
    group.key + environmentId
  )

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
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">{group.label}</span>
        {!state.showAdd && (
          <ActionButton
            action="add"
            onClick={() =>
              set({
                showAdd: true,
                editingIndex: null,
                confirmDeleteIndex: null,
              })
            }
          >
            {s.addButton}
          </ActionButton>
        )}
      </div>

      <div className="px-4 py-3">
        {state.showAdd && (
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <Label htmlFor={`variable-add-${group.key}`} className="text-xs">
              {s.valueLabel}
            </Label>
            <InputActions>
              <Input
                id={`variable-add-${group.key}`}
                aria-label={s.valueLabel}
                className="w-full min-w-0 font-mono text-xs sm:flex-1"
                value={state.addValue}
                onChange={(e) => set({ addValue: e.target.value })}
                placeholder={s.valuePlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                  if (e.key === "Escape") set({ showAdd: false, addValue: "" })
                }}
                autoFocus
              />
              <ActionBar>
                <ActionButton
                  action="save"
                  onClick={handleAdd}
                  disabled={!state.addValue.trim()}
                >
                  {s.saveButton}
                </ActionButton>
                <ActionButton
                  action="cancel"
                  onClick={() => set({ showAdd: false, addValue: "" })}
                >
                  {strings.common.cancel}
                </ActionButton>
              </ActionBar>
            </InputActions>
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
                <InputActions key={i}>
                  <Label
                    htmlFor={`variable-edit-${group.key}-${i}`}
                    className="sr-only"
                  >
                    {s.valueLabel}
                  </Label>
                  <Input
                    id={`variable-edit-${group.key}-${i}`}
                    aria-label={s.valueLabel}
                    className="w-full min-w-0 font-mono text-xs sm:flex-1"
                    value={state.editValue}
                    onChange={(e) => set({ editValue: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(i)
                      if (e.key === "Escape")
                        set({ editingIndex: null, editValue: "" })
                    }}
                    autoFocus
                  />
                  <ActionBar>
                    <ActionButton
                      action="save"
                      onClick={() => handleUpdate(i)}
                      disabled={!state.editValue.trim()}
                    >
                      {s.saveButton}
                    </ActionButton>
                    <ActionButton
                      action="cancel"
                      onClick={() => set({ editingIndex: null, editValue: "" })}
                    >
                      {strings.common.cancel}
                    </ActionButton>
                  </ActionBar>
                </InputActions>
              ) : state.confirmDeleteIndex === i ? (
                <div
                  key={i}
                  className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  <p className="flex-1 truncate font-mono text-xs text-destructive">
                    {s.deleteConfirm(val)}
                  </p>
                  <ActionBar className="justify-end">
                    <ActionButton
                      action="cancel"
                      onClick={() => set({ confirmDeleteIndex: null })}
                    >
                      {strings.common.cancel}
                    </ActionButton>
                    <ActionButton
                      action="delete"
                      onClick={() => handleDelete(i)}
                    >
                      {s.deleteButton}
                    </ActionButton>
                  </ActionBar>
                </div>
              ) : (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {val}
                  </span>
                  <ActionBar>
                    <ActionButton
                      action="edit"
                      iconOnly
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
                    ></ActionButton>
                    <ActionButton
                      action="delete"
                      iconOnly
                      type="button"
                      aria-label={strings.variables.manager.deleteAriaLabel}
                      onClick={() =>
                        set({ confirmDeleteIndex: i, editingIndex: null })
                      }
                    ></ActionButton>
                  </ActionBar>
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
    <div className="workspace-page">
      {/* Breadcrumb */}
      <PageHeader
        title={s.title}
        description={s.subtitle}
        parent={{ href: "/settings", label: strings.environments.page.title }}
      />

      {!activeEnvironment ? (
        <NoEnvironmentSelected className="mb-0" />
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {s.environmentLabel}{" "}
            <span className="font-medium text-foreground">
              {activeEnvironment.name}
            </span>
          </p>
          <div className="settings-list">
            {VARIABLE_GROUPS.map((group) => (
              <VariableGroupSection
                key={`${group.key}:${activeEnvironment.id}`}
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
