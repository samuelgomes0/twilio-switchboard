import {
  STORAGE_ERROR_EVENT,
  readStorageJson,
  readStorageValue,
  removeStorageValue,
  writeStorageJson,
  writeStorageValue,
} from "@/lib/browser-storage"

export interface TwilioEnvironment {
  id: string
  name: string
  accountSid: string
  authToken: string
}

const ENVIRONMENTS_KEY = "twilio-environments"
const ACTIVE_ENV_KEY = "twilio-active-env"

export function getEnvironments(): TwilioEnvironment[] {
  return readStorageJson(
    ENVIRONMENTS_KEY,
    (value): value is TwilioEnvironment[] =>
      Array.isArray(value) &&
      value.every(
        (environment) =>
          typeof environment === "object" &&
          environment !== null &&
          typeof environment.id === "string" &&
          environment.id.length > 0 &&
          typeof environment.name === "string" &&
          environment.name.trim().length > 0 &&
          typeof environment.accountSid === "string" &&
          /^AC[0-9a-f]{32}$/i.test(environment.accountSid) &&
          typeof environment.authToken === "string" &&
          environment.authToken.length > 0
      ),
    []
  )
}

export function saveEnvironments(envs: TwilioEnvironment[]): boolean {
  return writeStorageJson(ENVIRONMENTS_KEY, envs)
}

export function getActiveEnvironmentId(): string | null {
  return readStorageValue(ACTIVE_ENV_KEY)
}

export function setActiveEnvironmentId(id: string): boolean {
  return writeStorageValue(ACTIVE_ENV_KEY, id)
}

export function removeActiveEnvironmentId(): boolean {
  return removeStorageValue(ACTIVE_ENV_KEY)
}

const ENVIRONMENTS_CHANGED_EVENT = "switchboard:environments-changed"

export function subscribeEnvironments(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === ENVIRONMENTS_KEY ||
      event.key === ACTIVE_ENV_KEY
    )
      onChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(ENVIRONMENTS_CHANGED_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(ENVIRONMENTS_CHANGED_EVENT, onChange)
  }
}

export async function mutateEnvironments(
  change: (current: TwilioEnvironment[]) => TwilioEnvironment[] | null
): Promise<boolean> {
  const commit = () => {
    const updated = change(getEnvironments())
    if (!updated || !saveEnvironments(updated)) return false
    window.dispatchEvent(new CustomEvent(ENVIRONMENTS_CHANGED_EVENT))
    return true
  }
  // Serialize cooperating tabs where Web Locks is available; always re-read before writing.
  try {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return await navigator.locks.request("switchboard:environments", commit)
    }
    return commit()
  } catch {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT))
    return false
  }
}
