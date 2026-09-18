import { MAX_HISTORY } from "@/lib/constants"

export function readHistory<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function pushHistory<T>(key: string, entry: T): void {
  try {
    const previous = readHistory<T>(key)
    localStorage.setItem(
      key,
      JSON.stringify([entry, ...previous].slice(0, MAX_HISTORY))
    )
  } catch {}
}
