export const STORAGE_ERROR_EVENT = "switchboard:storage-error"

function reportStorageError(): void {
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent !== "undefined"
  ) {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT))
  }
}

export function readStorageValue(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    reportStorageError()
    return null
  }
}

export function readStorageJson<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  fallback: T
): T {
  const raw = readStorageValue(key)
  if (raw === null) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    if (isValid(value)) return value
  } catch {}
  reportStorageError()
  return fallback
}

export function writeStorageValue(key: string, value: string): boolean {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    reportStorageError()
    return false
  }
}

export function writeStorageJson(key: string, value: unknown): boolean {
  try {
    return writeStorageValue(key, JSON.stringify(value))
  } catch {
    reportStorageError()
    return false
  }
}

export function removeStorageValue(key: string): boolean {
  if (typeof window === "undefined") return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    reportStorageError()
    return false
  }
}
