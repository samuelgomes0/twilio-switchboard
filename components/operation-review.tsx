import { strings } from "@/lib/strings"
import type { OperationReview, TargetResult } from "@/lib/operation-review"

export function OperationReviewPanel({ review }: { review: OperationReview }) {
  const labels = strings.operationReview
  return (
    <section className="mt-5 space-y-3" aria-label={labels.title}>
      <h2 className="text-sm font-semibold">
        {labels.title} ({review.targets.length})
      </h2>
      <p className="max-w-prose text-sm text-muted-foreground">{labels.hint}</p>
      {review.partial && (
        <p role="status" className="text-sm text-warning">
          {labels.partial}
        </p>
      )}
      {review.targets.length === 0 ? (
        <p role="status" className="text-sm">
          {labels.empty}
        </p>
      ) : (
        <div className="max-h-72 overflow-auto rounded-md border">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b">
                <th className="p-3">{labels.resource}</th>
              </tr>
            </thead>
            <tbody>
              {review.targets.map((target) => (
                <tr key={target.id} className="border-b last:border-0">
                  <td className="p-3 font-mono">{target.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function OperationResults({ results }: { results: TargetResult[] }) {
  if (!results.length) return null
  const labels = strings.operationReview
  return (
    <section className="mt-5 space-y-3" aria-label={labels.result}>
      <h2 className="text-sm font-semibold">{labels.result}</h2>
      <div className="max-h-72 overflow-auto rounded-md border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b">
              <th className="p-3">{labels.resource}</th>
              <th className="p-3">{labels.result}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id} className="border-b last:border-0">
                <td className="p-3 font-mono">{result.id}</td>
                <td className="p-3">{labels[result.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function OperationRecovery({ status }: { status: string }) {
  if (status !== "error" && status !== "cancelled") return null
  return (
    <p role="status" className="mt-5 max-w-prose text-sm text-muted-foreground">
      {status === "cancelled"
        ? strings.operationReview.interrupted
        : strings.operationReview.recovery}
    </p>
  )
}
