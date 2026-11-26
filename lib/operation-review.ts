export interface ReviewTarget {
  id: string
  relatedId: string | null
}

export interface OperationReview {
  generatedAt: number
  targets: ReviewTarget[]
  partial: boolean
}

export const REVIEW_MAX_AGE = 5 * 60 * 1000
export const REVIEW_LIMIT = 1000

export function isOperationReview(
  value: unknown,
  prefix: "CH",
  now = Date.now()
): value is OperationReview {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const review = value as Record<string, unknown>
  if (
    typeof review.generatedAt !== "number" ||
    !Number.isFinite(review.generatedAt) ||
    now - review.generatedAt > REVIEW_MAX_AGE ||
    review.generatedAt > now + 30_000 ||
    typeof review.partial !== "boolean" ||
    !Array.isArray(review.targets) ||
    review.targets.length > REVIEW_LIMIT
  )
    return false
  const seen = new Set<string>()
  return review.targets.every((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false
    const target = value as Record<string, unknown>
    if (
      typeof target.id !== "string" ||
      !new RegExp(`^${prefix}[a-fA-F0-9]{32}$`).test(target.id) ||
      seen.has(target.id)
    )
      return false
    seen.add(target.id)
    return (
      target.relatedId === null ||
      (typeof target.relatedId === "string" &&
        /^CH[a-fA-F0-9]{32}$/.test(target.relatedId))
    )
  })
}

export type TargetStatus =
  "pending" | "success" | "warning" | "error" | "skipped"
export interface TargetResult {
  id: string
  status: TargetStatus
}
export function isTargetResult(value: unknown): value is TargetResult {
  if (!value || typeof value !== "object") return false
  const result = value as Record<string, unknown>
  return (
    typeof result.id === "string" &&
    result.id.length > 0 &&
    result.id.length <= 512 &&
    typeof result.status === "string" &&
    ["pending", "success", "warning", "error", "skipped"].includes(
      result.status
    )
  )
}
