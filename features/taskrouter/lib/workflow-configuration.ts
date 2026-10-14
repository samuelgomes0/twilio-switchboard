import type {
  JsonObject,
  JsonValue,
  WorkflowConfiguration,
  WorkflowConfigurationParseResult,
  WorkflowFilter,
  WorkflowTarget,
} from "@/features/taskrouter/types"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return isPlainObject(value)
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true
  }
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (!isPlainObject(value)) return false
  return Object.values(value).every(isJsonValue)
}

function hasOptionalString(value: JsonObject, key: string): boolean {
  return !(key in value) || typeof value[key] === "string"
}

function hasOptionalNumberOrString(value: JsonObject, key: string): boolean {
  return (
    !(key in value) ||
    typeof value[key] === "number" ||
    typeof value[key] === "string"
  )
}

function isWorkflowTarget(value: JsonValue): value is WorkflowTarget {
  return (
    isJsonObject(value) &&
    hasOptionalString(value, "queue") &&
    hasOptionalNumberOrString(value, "priority") &&
    hasOptionalNumberOrString(value, "timeout") &&
    hasOptionalString(value, "expression") &&
    hasOptionalString(value, "skip_if")
  )
}

function isWorkflowFilter(value: JsonValue): value is WorkflowFilter {
  if (!isJsonObject(value)) return false
  if (
    !hasOptionalString(value, "filter_friendly_name") ||
    !hasOptionalString(value, "friendly_name") ||
    !hasOptionalString(value, "expression")
  ) {
    return false
  }
  return (
    !("targets" in value) ||
    (Array.isArray(value.targets) && value.targets.every(isWorkflowTarget))
  )
}

export function isWorkflowConfiguration(
  value: unknown
): value is WorkflowConfiguration {
  if (!isJsonValue(value) || !isJsonObject(value)) return false
  const taskRouting = value.task_routing
  if (!taskRouting || !isJsonObject(taskRouting)) return false

  if (
    "filters" in taskRouting &&
    (!Array.isArray(taskRouting.filters) ||
      !taskRouting.filters.every(isWorkflowFilter))
  ) {
    return false
  }

  return (
    !("default_filter" in taskRouting) ||
    isWorkflowTarget(taskRouting.default_filter)
  )
}

export function parseWorkflowConfiguration(
  raw: string
): WorkflowConfigurationParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, issue: "invalid-json" }
  }

  return isWorkflowConfiguration(parsed)
    ? { ok: true, configuration: parsed }
    : { ok: false, issue: "invalid-structure" }
}

function sortJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (!isJsonObject(value)) return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) =>
        left < right ? -1 : left > right ? 1 : 0
      )
      .map(([key, child]) => [key, sortJsonValue(child)])
  )
}

export function stringifyWorkflowConfiguration(
  configuration: WorkflowConfiguration,
  space?: number
): string {
  return JSON.stringify(sortJsonValue(configuration), null, space)
}

export function getValidatedWorkflowQueueSids(
  configuration: WorkflowConfiguration
): string[] | null {
  const queueSids = new Set<string>()
  const filters = configuration.task_routing.filters ?? []

  for (const filter of filters) {
    if (!filter.expression?.trim() || !filter.targets?.length) return null
    for (const target of filter.targets) {
      if (!target.queue || !/^WQ[0-9a-f]{32}$/i.test(target.queue)) return null
      queueSids.add(target.queue)
    }
  }

  const defaultQueue = configuration.task_routing.default_filter?.queue
  if (configuration.task_routing.default_filter && !defaultQueue) return null
  if (defaultQueue) {
    if (!/^WQ[0-9a-f]{32}$/i.test(defaultQueue)) return null
    queueSids.add(defaultQueue)
  }

  return [...queueSids]
}
