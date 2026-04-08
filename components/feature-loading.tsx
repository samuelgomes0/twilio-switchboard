export function FeatureLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2">
        <div className="h-3.5 w-24 rounded-md bg-muted" />
        <div className="size-3 rounded bg-muted" />
        <div className="h-3.5 w-32 rounded-md bg-muted" />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="size-9 shrink-0 rounded-lg bg-muted" />
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded-md bg-muted" />
          <div className="h-3.5 w-64 rounded-md bg-muted" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-3.5 w-28 rounded-md bg-muted" />
          <div className="h-9 w-full rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded-md bg-muted" />
          <div className="h-9 w-full rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded-md bg-muted" />
          <div className="h-24 w-full rounded-md bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>
    </div>
  )
}
