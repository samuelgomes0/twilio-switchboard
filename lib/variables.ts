import { strings } from "@/lib/strings"
import { STORED_KEYS } from "./stored-keys"

const MAX_SAVED = 10

export function effectiveKey(key: string, environmentId?: string): string {
  return environmentId ? `${key}:${environmentId}` : key
}

export function readVariables(key: string, environmentId?: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(effectiveKey(key, environmentId))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeVariables(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch {}
}

export function addVariable(
  key: string,
  value: string,
  environmentId?: string
): string[] {
  const eKey = effectiveKey(key, environmentId)
  const t = value.trim()
  if (!t) return readVariables(key, environmentId)
  const next = [
    t,
    ...readVariables(key, environmentId).filter((v) => v !== t),
  ].slice(0, MAX_SAVED)
  writeVariables(eKey, next)
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
  writeVariables(eKey, next)
  return next
}

export function deleteVariable(
  key: string,
  value: string,
  environmentId?: string
): string[] {
  const eKey = effectiveKey(key, environmentId)
  const next = readVariables(key, environmentId).filter((v) => v !== value)
  writeVariables(eKey, next)
  return next
}

export type VariableGroup = {
  key: string
  label: string
}

export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    key: STORED_KEYS.workspaceSids,
    label: strings.variables.groups.workspaceSids,
  },
  { key: STORED_KEYS.queueNames, label: strings.variables.groups.queueNames },
  { key: STORED_KEYS.skillNames, label: strings.variables.groups.skillNames },
  {
    key: STORED_KEYS.workflowNames,
    label: strings.variables.groups.workflowNames,
  },
  {
    key: STORED_KEYS.workerIdentifiers,
    label: strings.variables.groups.workerIdentifiers,
  },
  {
    key: STORED_KEYS.conversationSids,
    label: strings.variables.groups.conversationSids,
  },
  {
    key: STORED_KEYS.closeMessages,
    label: strings.variables.groups.closeMessages,
  },
]
