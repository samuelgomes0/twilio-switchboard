import { MAX_HISTORY } from "@/lib/constants"
import {
  readStorageJson,
  removeStorageValue,
  writeStorageJson,
} from "@/lib/browser-storage"

export function readHistory<T>(key: string): T[] {
  return readStorageJson(
    key,
    (value): value is T[] =>
      Array.isArray(value) &&
      value.every(
        (entry) =>
          typeof entry === "object" && entry !== null && !Array.isArray(entry)
      ),
    []
  ).slice(0, MAX_HISTORY)
}

export function pushHistory<T>(key: string, entry: T): void {
  const previous = readHistory<T>(key)
  writeStorageJson(key, [entry, ...previous].slice(0, MAX_HISTORY))
}

export function clearHistory(key: string): void {
  removeStorageValue(key)
}

export function environmentHistoryKey(
  baseKey: string,
  environmentId: string
): string {
  return `${baseKey}:${environmentId}`
}
