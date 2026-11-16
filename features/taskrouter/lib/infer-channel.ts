export function inferChannel(
  attributes: string,
  taskChannel: string | null
): "whatsapp" | "voice" | "unknown" {
  try {
    const attrs = JSON.parse(attributes) as Record<string, unknown>
    const from = typeof attrs.from === "string" ? attrs.from : ""
    if (from.startsWith("whatsapp:")) return "whatsapp"
    if (from.startsWith("+") || /^\d+$/.test(from)) return "voice"
  } catch {}
  if (taskChannel === "voice") return "voice"
  return "unknown"
}
