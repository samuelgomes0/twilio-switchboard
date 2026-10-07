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
  activeEnvironmentRevision: number
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
  const [activeEnvironmentRevision, bumpActiveEnvironmentRevision] =
    React.useReducer((revision: number) => revision + 1, 0)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const storedEnvironments = getEnvironments()
      const storedActiveId = getActiveEnvironmentId()
      setEnvironments(storedEnvironments)
      if (
        storedActiveId &&
        storedEnvironments.some((environment) => environment.id === storedActiveId)
      ) {
        setActiveId(storedActiveId)
      } else {
        setActiveId(null)
        if (storedActiveId) removeActiveEnvironmentId()
      }
      setHydrated(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const activeEnvironment = React.useMemo(
    () =>
      hydrated ? (environments.find((e) => e.id === activeId) ?? null) : null,
    [environments, activeId, hydrated]
  )

  function addEnvironment(env: Omit<TwilioEnvironment, "id">) {
    const newEnv: TwilioEnvironment = { id: crypto.randomUUID(), ...env }
    const updated = [...environments, newEnv]
    if (!saveEnvironments(updated)) return
    setEnvironments(updated)
  }

  function updateEnvironment(
    id: string,
    updates: Omit<TwilioEnvironment, "id">
  ) {
    const updated = environments.map((e) =>
      e.id === id ? { id, ...updates } : e
    )
    if (!saveEnvironments(updated)) return
    setEnvironments(updated)
    if (activeId === id) bumpActiveEnvironmentRevision()
  }

  function deleteEnvironment(id: string) {
    const updated = environments.filter((e) => e.id !== id)
    if (!saveEnvironments(updated)) return
    if (activeId === id) removeActiveEnvironmentId()
    setEnvironments(updated)
    if (activeId === id) {
      setActiveId(null)
      bumpActiveEnvironmentRevision()
    }
  }

  function setActive(id: string) {
    if (!setActiveEnvironmentId(id)) return
    setActiveId(id)
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
