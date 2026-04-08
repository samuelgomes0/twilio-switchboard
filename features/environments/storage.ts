export interface TwilioEnvironment {
  id: string
  name: string
  accountSid: string
  authToken: string
}

const ENVIRONMENTS_KEY = "twilio-environments"
const ACTIVE_ENV_KEY = "twilio-active-env"

export function getEnvironments(): TwilioEnvironment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ENVIRONMENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TwilioEnvironment[]
  } catch {
    return []
  }
}

export function saveEnvironments(envs: TwilioEnvironment[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(envs))
}

export function getActiveEnvironmentId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACTIVE_ENV_KEY)
}

export function setActiveEnvironmentId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACTIVE_ENV_KEY, id)
}

export function removeActiveEnvironmentId(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACTIVE_ENV_KEY)
}
