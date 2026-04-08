"use client"

import * as React from "react"
import Link from "next/link"
import { AtSign, ChevronRight, Loader2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { StoredInput } from "@/components/stored-input"
import { useEnvironment } from "@/features/environments/context"
import type { ParticipantConversation } from "@/features/conversations/lib/fetch-by-participant"

interface HistoryEntry {
  ts: number
  address: string
  count: number
}

const HISTORY_KEY = "switchboard:fetch-by-participant-history"
const ADDRESSES_KEY = "switchboard:participant-addresses"
const MAX_HISTORY = 5

function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function pushHistory(entry: HistoryEntry) {
  try {
    const prev = readHistory()
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY))
    )
  } catch {}
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(d: Date | null | string): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type StateVariant = "success" | "warning" | "secondary" | "outline"

function stateVariant(state: string): StateVariant {
  if (state === "active") return "success"
  if (state === "inactive") return "warning"
  if (state === "closed") return "secondary"
  return "outline"
}

export function FetchByParticipantForm() {
  const { activeEnvironment } = useEnvironment()
  const [address, setAddress] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<ParticipantConversation[] | null>(null)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit = address.trim().length > 0 && !loading && !!activeEnvironment

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch(
        `/api/conversations/fetch-by-participant?address=${encodeURIComponent(address.trim())}`,
        {
          headers: {
            "x-twilio-account-sid": activeEnvironment.accountSid,
            "x-twilio-auth-token": activeEnvironment.authToken,
          },
        }
      )
      const json = (await res.json()) as {
        conversations: ParticipantConversation[]
        error?: string
      }
      if (!res.ok || json.error) {
        setError(json.error ?? "Erro desconhecido")
        return
      }
      setResults(json.conversations)
      const entry: HistoryEntry = {
        ts: Date.now(),
        address: address.trim(),
        count: json.conversations.length,
      }
      pushHistory(entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void runSearch()
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-sm">
        <Link
          href="/conversations"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Conversations
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">Buscar por Participante</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <AtSign className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Buscar por Participante
          </h1>
          <p className="text-sm text-muted-foreground">
            Retorna todas as conversas associadas a um endereço de participante
          </p>
        </div>
      </div>

      {/* No environment warning */}
      {!activeEnvironment && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              Nenhum ambiente selecionado
            </p>
            <p className="mt-0.5 text-destructive/80">
              Selecione um ambiente antes de executar operações.{" "}
              <Link
                href="/environments"
                className="underline underline-offset-2 hover:text-destructive"
              >
                Gerenciar ambientes
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Endereço do participante</Label>
          <div className="flex gap-2">
            <StoredInput
              id="address"
              storageKey={ADDRESSES_KEY}
              value={address}
              onChange={setAddress}
              placeholder="whatsapp:+5511999999999"
              disabled={loading}
              containerClassName="flex-1"
              className="font-sans text-sm placeholder:font-sans"
            />
            <Button type="submit" disabled={!canSubmit} className="shrink-0 gap-2">
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <AtSign className="size-3.5" />
              )}
              Buscar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos: whatsapp:+55... · sms:+55... · messenger:...
          </p>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa encontrada para esse endereço.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {results.length} conversa(s) encontrada(s)
              </p>
              <ul className="space-y-2">
                {results.map((pc) => (
                  <li
                    key={pc.conversationSid}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                          {pc.conversationSid}
                        </p>
                        {pc.conversationFriendlyName && (
                          <p className="mt-0.5 text-sm font-medium">
                            {pc.conversationFriendlyName}
                          </p>
                        )}
                      </div>
                      <Badge variant={stateVariant(pc.conversationState)}>
                        {pc.conversationState}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                      <span>Criada: {formatDate(pc.conversationDateCreated)}</span>
                      <span>Atualizada: {formatDate(pc.conversationDateUpdated)}</span>
                    </div>
                    {pc.participantIdentity && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Identidade: <span className="font-mono">{pc.participantIdentity}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Últimas consultas
          </p>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                <span className="font-mono">{h.address}</span>
                {" · "}
                {h.count} conversa(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
