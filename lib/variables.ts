import { strings } from "@/lib/strings"
import { STORED_KEYS } from "./stored-keys"
import { readStorageJson, writeStorageJson } from "@/lib/browser-storage"

const MAX_SAVED = 10

function effectiveKey(key: string, environmentId?: string): string {
  return environmentId ? `${key}:${environmentId}` : key
}

export function readVariables(key: string, environmentId?: string): string[] {
  const values = readStorageJson(
    effectiveKey(key, environmentId),
    (value): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === "string"),
    []
  )
  return [...new Set(values.filter((value) => value.trim().length > 0))].slice(
    0,
    MAX_SAVED
  )
}

export function addVariable(
  key: string,
  value: string,
  environmentId?: string
): string[] {
  const eKey = effectiveKey(key, environmentId)
  const t = value.trim()
  if (!t) return readVariables(key, environmentId)
  const previous = readVariables(key, environmentId)
  const next = [
    t,
    ...previous.filter((v) => v !== t),
  ].slice(0, MAX_SAVED)
  writeStorageJson(eKey, next)
  return next
}

export function updateVariable(
  key: string,
  oldValue: string,
  newValue: string,
  environmentId?: string
): string[] {
  const eKey = effectiveKey(key, environmentId)
  const t = newValue.trim()
  if (!t) return readVariables(key, environmentId)
  const next = readVariables(key, environmentId).map((v) =>
    v === oldValue ? t : v
  )
  writeStorageJson(eKey, next)
  return next
}

export function deleteVariable(
  key: string,
  value: string,
  environmentId?: string
): string[] {
  const eKey = effectiveKey(key, environmentId)
  const previous = readVariables(key, environmentId)
  const next = previous.filter((v) => v !== value)
  writeStorageJson(eKey, next)
  return next
}

export type VariableGroup = {
  key: string
  label: string
  scope: "environment" | "global"
}

export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    key: STORED_KEYS.workspaceSids,
    label: strings.variables.groups.workspaceSids,
    scope: "environment",
  },
  {
    key: STORED_KEYS.queueNames,
    label: strings.variables.groups.queueNames,
    scope: "environment",
  },
  {
    key: STORED_KEYS.skillNames,
    label: strings.variables.groups.skillNames,
    scope: "environment",
  },
  {
    key: STORED_KEYS.workflowNames,
    label: strings.variables.groups.workflowNames,
    scope: "environment",
  },
  {
    key: STORED_KEYS.workerIdentifiers,
    label: strings.variables.groups.workerIdentifiers,
    scope: "environment",
  },
  {
    key: STORED_KEYS.conversationSids,
    label: strings.variables.groups.conversationSids,
    scope: "environment",
  },
  {
    key: STORED_KEYS.closeMessages,
    label: strings.variables.groups.closeMessages,
    scope: "global",
  },
  {
    key: STORED_KEYS.flexAddresses,
    label: strings.variables.groups.flexAddresses,
    scope: "environment",
  },
  {
    key: STORED_KEYS.conversationServiceSids,
    label: strings.variables.groups.conversationServiceSids,
    scope: "environment",
  },
  {
    key: STORED_KEYS.studioFlowSids,
    label: strings.variables.groups.studioFlowSids,
    scope: "environment",
  },
]
