import { strings } from "@/lib/strings"

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export function JsonBlock({
  value,
  className = "max-h-64 overflow-auto rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed",
}: {
  value: string
  className?: string
}) {
  const parsed = tryParseJson(value)
  const isEmpty =
    parsed === null ||
    parsed === "" ||
    (typeof parsed === "object" && Object.keys(parsed).length === 0)

  if (isEmpty) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {strings.common.empty}
      </span>
    )
  }

  return (
    <pre className={className}>
      {JSON.stringify(parsed, null, 2)}
    </pre>
  )
}
