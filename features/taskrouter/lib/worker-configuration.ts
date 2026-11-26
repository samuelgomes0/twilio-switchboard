export interface WorkerConfiguration {
  skills: { name: string; level: number | null }[]
  features: { name: string; enabled: boolean | null }[]
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
export function readWorkerConfiguration(
  raw: string
): WorkerConfiguration | null {
  try {
    const attributes: unknown = JSON.parse(raw)
    if (!isRecord(attributes)) return null
    const routing = attributes.routing === undefined ? {} : attributes.routing
    const overrides =
      attributes.config_overrides === undefined
        ? {}
        : attributes.config_overrides
    if (!isRecord(routing) || !isRecord(overrides)) return null
    const skills = routing.skills === undefined ? [] : routing.skills
    const levels = routing.levels === undefined ? {} : routing.levels
    const features = overrides.features === undefined ? {} : overrides.features
    if (
      !Array.isArray(skills) ||
      !skills.every((item): item is string => typeof item === "string") ||
      !isRecord(levels) ||
      !isRecord(features)
    )
      return null
    return {
      skills: skills.map((name) => ({
        name,
        level:
          typeof levels[name] === "number" && Number.isFinite(levels[name])
            ? levels[name]
            : null,
      })),
      features: Object.entries(features).map(([name, value]) => ({
        name,
        enabled:
          isRecord(value) && typeof value.enabled === "boolean"
            ? value.enabled
            : null,
      })),
    }
  } catch {
    return null
  }
}
