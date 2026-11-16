import { Badge } from "@/components/ui/badge"
import type {
  WorkflowCsvDiagnosticReason,
  WorkflowCsvPreview,
} from "@/features/taskrouter/types"
import { strings } from "@/lib/strings"

const labels = strings.taskrouter.createWorkflow

const REASONS: Record<WorkflowCsvDiagnosticReason, string> = {
  ready: labels.previewReason.ready,
  "incomplete-row": labels.previewReason.incompleteRow,
  "excluded-row": labels.previewReason.excludedRow,
  "duplicate-row": labels.previewReason.duplicateRow,
  "invalid-rule": labels.previewReason.invalidRule,
  "queue-not-found": labels.previewReason.queueNotFound,
}

export function WorkflowCsvPreviewPanel({
  preview,
}: {
  preview: WorkflowCsvPreview
}) {
  return (
    <section
      className="mt-6 space-y-4"
      aria-labelledby="workflow-csv-preview-heading"
    >
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="workflow-csv-preview-heading"
            className="text-base font-semibold"
          >
            {labels.analysisTitle}
          </h2>
          <p
            role="status"
            className="mt-1 max-w-2xl text-sm text-muted-foreground"
          >
            {preview.canCreate
              ? labels.analysisReady
              : preview.totalRows === 0
                ? labels.analysisNoRows
                : labels.analysisBlocked}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            {labels.previewSummary.valid(preview.validRows)}
          </Badge>
          <Badge variant="secondary">
            {labels.previewSummary.ignored(preview.ignoredRows)}
          </Badge>
          <Badge variant={preview.errorRows > 0 ? "destructive" : "outline"}>
            {labels.previewSummary.errors(preview.errorRows)}
          </Badge>
        </div>
      </div>

      {preview.defaultQueueFound === false && (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          {labels.defaultQueueMissing}
        </div>
      )}

      {preview.diagnostics.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-auto">
            <table className="min-w-[52rem] w-full text-sm">
              <caption className="sr-only">
                {labels.previewTable.caption}
              </caption>
              <thead className="border-b border-border bg-muted">
                <tr>
                  <th scope="col" className="w-16 px-4 py-3 text-left">
                    {labels.previewTable.line}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    {labels.previewTable.rule}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    {labels.previewTable.queue}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    {labels.previewTable.result}
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.diagnostics.map((diagnostic) => (
                  <tr
                    key={`${diagnostic.lineNumber}-${diagnostic.reason}`}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {diagnostic.lineNumber}
                    </td>
                    <td className="px-4 py-3 break-words">
                      {diagnostic.rule || strings.common.notAvailable}
                    </td>
                    <td className="px-4 py-3">
                      <p>
                        {diagnostic.queueName || strings.common.notAvailable}
                      </p>
                      {diagnostic.queueSid && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                          {diagnostic.queueSid}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={
                            diagnostic.status === "valid"
                              ? "success"
                              : diagnostic.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {diagnostic.status === "valid"
                            ? labels.previewStatus.valid
                            : diagnostic.status === "error"
                              ? labels.previewStatus.error
                              : labels.previewStatus.ignored}
                        </Badge>
                        <span className="text-xs leading-5 text-muted-foreground">
                          {REASONS[diagnostic.reason]}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
