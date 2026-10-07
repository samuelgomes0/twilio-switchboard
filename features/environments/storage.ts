import {
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
