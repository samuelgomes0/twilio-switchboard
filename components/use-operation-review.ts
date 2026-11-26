"use client"
import * as React from "react"
import { useEnvironment } from "@/features/environments/context"
import {
  isOperationReview,
  REVIEW_MAX_AGE,
  type OperationReview,
} from "@/lib/operation-review"
import { strings } from "@/lib/strings"

export function useOperationReview(
  endpoint: string,
  prefix: "CH",
  fields: Record<string, unknown>
) {
  const { activeEnvironment } = useEnvironment()
  const signature = JSON.stringify([activeEnvironment?.id, fields])
  const signatureRef = React.useRef(signature)
  React.useEffect(() => {
    signatureRef.current = signature
  }, [signature])
  const [snapshot, setSnapshot] = React.useState<{
    signature: string
    review: OperationReview
  } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [expired, setExpired] = React.useState(false)
  const controllerRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => controllerRef.current?.abort(), [signature])
  React.useEffect(() => {
    if (!snapshot) return
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, snapshot.review.generatedAt + REVIEW_MAX_AGE - Date.now())
    )
    return () => clearTimeout(timer)
  }, [snapshot])
  const review =
    snapshot?.signature === signature && !expired ? snapshot.review : null
  async function analyze() {
    if (!activeEnvironment || controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError(null)
    setSnapshot(null)
    setExpired(false)
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          previewOnly: true,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })
      const data: unknown = await response.json()
      controller.signal.throwIfAborted()
      if (signatureRef.current !== signature) return
      if (!response.ok || !isOperationReview(data, prefix)) throw new Error()
      setSnapshot({ signature, review: data })
    } catch {
      if (!controller.signal.aborted) setError(strings.operationReview.failed)
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setLoading(false)
      }
    }
  }
  function currentReview() {
    return review && isOperationReview(review, prefix) && review.targets.length
      ? review
      : null
  }
  return {
    review,
    loading,
    error:
      error ?? (snapshot && !review ? strings.operationReview.invalid : null),
    analyze,
    cancel: () => controllerRef.current?.abort(),
    currentReview,
    invalidate: () => setSnapshot(null),
  }
}
