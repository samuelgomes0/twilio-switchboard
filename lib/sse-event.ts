export function sseEvent(
  level: string,
  message: string,
  data?: Record<string, unknown>
): string {
  return `data: ${JSON.stringify({ level, message, ...(data ?? {}) })}\n\n`
}
