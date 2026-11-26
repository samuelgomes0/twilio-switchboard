"use client"

import { confirmDiscardChanges } from "@/lib/unsaved-changes"
import {
  type TwilioEnvironment,
  getActiveEnvironmentId,
  getEnvironments,
  removeActiveEnvironmentId,
  mutateEnvironments,
  subscribeEnvironments,
  setActiveEnvironmentId,
} from "@/features/environments/storage"
import * as React from "react"

interface EnvironmentContextValue {
  environments: TwilioEnvironment[]
  activeEnvironment: TwilioEnvironment | null
  activeEnvironmentRevision: number
  addEnvironment: (env: Omit<TwilioEnvironment, "id">) => Promise<boolean>
  updateEnvironment: (
    id: string,
    updates: Omit<TwilioEnvironment, "id">
  ) => Promise<boolean>
  deleteEnvironment: (id: string) => Promise<boolean>
  setActive: (id: string) => void
}

const EnvironmentContext = React.createContext<EnvironmentContextValue | null>(
  null
)

function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [environments, setEnvironments] = React.useState<TwilioEnvironment[]>(
    []
  )
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeEnvironmentRevision, bumpActiveEnvironmentRevision] =
    React.useReducer((revision: number) => revision + 1, 0)
  const [hydrated, setHydrated] = React.useState(false)

  const snapshotRef = React.useRef<{ active: TwilioEnvironment | null }>({
    active: null,
  })
  React.useEffect(() => {
    function refresh() {
      const storedEnvironments = getEnvironments()
      const storedActiveId = getActiveEnvironmentId()
      const active =
        storedEnvironments.find(
          (environment) => environment.id === storedActiveId
        ) ?? null
      const previous = snapshotRef.current.active
      if (
        previous &&
        active &&
        previous.id === active.id &&
        (previous.accountSid !== active.accountSid ||
          previous.authToken !== active.authToken ||
          previous.name !== active.name)
      )
        bumpActiveEnvironmentRevision()
      snapshotRef.current = { active }
      setEnvironments(storedEnvironments)
      setActiveId(active?.id ?? null)
      setHydrated(true)
    }
    const frame = requestAnimationFrame(refresh)
    const unsubscribe = subscribeEnvironments(refresh)
    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
    }
  }, [])

  const activeEnvironment = React.useMemo(
    () =>
      hydrated ? (environments.find((e) => e.id === activeId) ?? null) : null,
    [environments, activeId, hydrated]
  )

  async function addEnvironment(env: Omit<TwilioEnvironment, "id">) {
    const newEnv: TwilioEnvironment = { id: crypto.randomUUID(), ...env }
    return mutateEnvironments((current) => [...current, newEnv])
  }

  async function updateEnvironment(
    id: string,
    updates: Omit<TwilioEnvironment, "id">
  ) {
    return mutateEnvironments((current) =>
      current.some((environment) => environment.id === id)
        ? current.map((environment) =>
            environment.id === id ? { id, ...updates } : environment
          )
        : null
    )
  }

  async function deleteEnvironment(id: string) {
    const saved = await mutateEnvironments((current) =>
      current.filter((environment) => environment.id !== id)
    )
    if (!saved) return false
    if (getActiveEnvironmentId() === id) removeActiveEnvironmentId()
    if (activeId === id) bumpActiveEnvironmentRevision()
    return true
  }

  function setActive(id: string) {
    if (id === activeId || !confirmDiscardChanges()) return
    if (!setActiveEnvironmentId(id)) return
    setActiveId(id)
    snapshotRef.current = {
      active: environments.find((environment) => environment.id === id) ?? null,
    }
    bumpActiveEnvironmentRevision()
  }

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        activeEnvironment,
        activeEnvironmentRevision,
        addEnvironment,
        updateEnvironment,
        deleteEnvironment,
        setActive,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

function useEnvironment(): EnvironmentContextValue {
  const ctx = React.useContext(EnvironmentContext)
  if (!ctx) {
    throw new Error("useEnvironment must be used inside <EnvironmentProvider>")
  }
  return ctx
}

export { EnvironmentProvider, useEnvironment }
