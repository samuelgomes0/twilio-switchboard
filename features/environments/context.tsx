"use client"

import {
  type TwilioEnvironment,
  getActiveEnvironmentId,
  getEnvironments,
  removeActiveEnvironmentId,
  saveEnvironments,
  setActiveEnvironmentId,
} from "@/features/environments/storage"
import * as React from "react"

interface EnvironmentContextValue {
  environments: TwilioEnvironment[]
  activeEnvironment: TwilioEnvironment | null
  addEnvironment: (env: Omit<TwilioEnvironment, "id">) => void
  updateEnvironment: (
    id: string,
    updates: Omit<TwilioEnvironment, "id">
  ) => void
  deleteEnvironment: (id: string) => void
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
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setEnvironments(getEnvironments())
    setActiveId(getActiveEnvironmentId())
    setHydrated(true)
  }, [])

  const activeEnvironment = React.useMemo(
    () =>
      hydrated ? (environments.find((e) => e.id === activeId) ?? null) : null,
    [environments, activeId, hydrated]
  )

  function addEnvironment(env: Omit<TwilioEnvironment, "id">) {
    const newEnv: TwilioEnvironment = { id: crypto.randomUUID(), ...env }
    const updated = [...environments, newEnv]
    setEnvironments(updated)
    saveEnvironments(updated)
  }

  function updateEnvironment(
    id: string,
    updates: Omit<TwilioEnvironment, "id">
  ) {
    const updated = environments.map((e) =>
      e.id === id ? { id, ...updates } : e
    )
    setEnvironments(updated)
    saveEnvironments(updated)
  }

  function deleteEnvironment(id: string) {
    const updated = environments.filter((e) => e.id !== id)
    setEnvironments(updated)
    saveEnvironments(updated)
    if (activeId === id) {
      setActiveId(null)
      removeActiveEnvironmentId()
    }
  }

  function setActive(id: string) {
    setActiveId(id)
    setActiveEnvironmentId(id)
  }

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        activeEnvironment,
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
