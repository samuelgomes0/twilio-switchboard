export function normalizeClosePhone(raw: string): string | null {
  const phone = raw.trim().replace(/^whatsapp:/i, "").replace(/[\s()-]/g, "")
  if (/^[1-9]\d{9,10}$/.test(phone)) return `whatsapp:+55${phone}`
  if (/^\+?55[1-9]\d{9,10}$/.test(phone))
    return `whatsapp:+${phone.replace(/^\+/, "")}`
  return null
}
