export type SseLevel = "info" | "success" | "warning" | "error"

export interface SsePayload {
  level: SseLevel
  message: string
  done?: boolean
  [key: string]: unknown
}

export class SseProtocolError extends Error {
  constructor() {
    super("Invalid or incomplete SSE response")
    this.name = "SseProtocolError"
  }
}

function parsePayload(data: string): SsePayload {
  let value: unknown
  try {
    value = JSON.parse(data)
  } catch {
    throw new SseProtocolError()
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SseProtocolError()
  }

  const payload = value as Record<string, unknown>
  if (
    (payload.level !== "info" &&
      payload.level !== "success" &&
      payload.level !== "warning" &&
      payload.level !== "error") ||
    typeof payload.message !== "string" ||
    (payload.done !== undefined && typeof payload.done !== "boolean")
  ) {
    throw new SseProtocolError()
  }

  return payload as SsePayload
}

function dataFromFrame(frame: string): string | null {
  const dataLines = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
  return dataLines.length > 0 ? dataLines.join("\n") : null
}

export async function consumeSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (payload: SsePayload) => void
): Promise<SsePayload> {
  const decoder = new TextDecoder()
  let buffer = ""
  let finalPayload: SsePayload | null = null

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ""

      for (const event of events) {
        const data = dataFromFrame(event)
        if (data === null) continue
        if (finalPayload) throw new SseProtocolError()
        const payload = parsePayload(data)
        if (payload.done === true) finalPayload = payload
        else onEvent(payload)
      }
    }
    buffer += decoder.decode()
    if (buffer.trim() || !finalPayload) throw new SseProtocolError()
    // Commit completion only after EOF proves there are no duplicate final events.
    onEvent(finalPayload)
    return finalPayload
  } finally {
    try {
      await reader.cancel()
    } finally {
      reader.releaseLock()
    }
  }
}
