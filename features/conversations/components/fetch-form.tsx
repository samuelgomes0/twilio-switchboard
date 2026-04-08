"use client"

import { AlertTriangle, ChevronRight, Loader2, Search } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { StoredInput } from "@/components/stored-input"
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  type FetchResponse,
  type MessagingBinding,
} from "@/features/conversations/types"
import { useEnvironment } from "@/features/environments/context"

type ConversationState = "active" | "inactive" | "closed" | string

interface HistoryEntry {
  ts: number
  sid: string
  state: string | null
  friendlyName: string | null
}

const HISTORY_KEY = "switchboard:fetch-history"
const SIDS_KEY = "switchboard:conversation-sids"
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

function stateBadgeVariant(state: ConversationState) {
  if (state === "active") return "success" as const
  if (state === "inactive") return "warning" as const
  if (state === "closed") return "secondary" as const
  return "outline" as const
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
    second: "2-digit",
  })
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function JsonBlock({ value }: { value: string }) {
  const parsed = tryParseJson(value)
  const isEmpty =
    parsed === null ||
    parsed === "" ||
    (typeof parsed === "object" && Object.keys(parsed as object).length === 0)

  if (isEmpty) {
    return <span className="text-xs text-muted-foreground italic">vazio</span>
  }

  return (
    <pre className="max-h-64 overflow-auto rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  )
}

export function FetchForm() {
  const { activeEnvironment } = useEnvironment()
  const [sid, setSid] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<FetchResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit = sid.trim().length > 0 && !loading && !!activeEnvironment

  async function runSearch() {
    if (!canSubmit || !activeEnvironment) return

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(
        `/api/conversations/fetch?sid=${encodeURIComponent(sid.trim())}`,
        {
          headers: {
            "x-twilio-account-sid": activeEnvironment.accountSid,
            "x-twilio-auth-token": activeEnvironment.authToken,
          },
        }
      )
      const json = (await res.json()) as FetchResponse & { error?: string }

      if (!res.ok || json.error) {
        setError(json.error ?? "Erro desconhecido")
        return
      }

      setData(json)
      const entry: HistoryEntry = {
        ts: Date.now(),
        sid: json.conversation.sid,
        state: json.conversation.state ?? null,
        friendlyName: json.conversation.friendlyName ?? null,
      }
      pushHistory(entry)
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setConfirmOpen(true)
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
        <span className="font-medium text-foreground">Buscar Conversa</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Search className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Buscar Conversa por SID
          </h1>
          <p className="text-sm text-muted-foreground">
            Retorna estado, participantes, atributos e datas de uma conversa
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
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sid">Conversation SID</Label>
          <div className="flex gap-2">
            <StoredInput
              id="sid"
              storageKey={SIDS_KEY}
              value={sid}
              onChange={setSid}
              placeholder="CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={loading}
              containerClassName="flex-1"
            />
            <Button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 gap-2"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              Buscar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Formato: CH seguido de 32 caracteres hexadecimais
          </p>
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buscar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Buscar dados da conversa <strong>{sid}</strong> no ambiente{" "}
              <strong>{activeEnvironment?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runSearch()
              }}
            >
              Buscar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Result */}
      {data && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-mono text-sm">
                    {data.conversation.sid}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {data.conversation.friendlyName ?? "Sem nome amigável"}
                  </CardDescription>
                </div>
                <Badge variant={stateBadgeVariant(data.conversation.state)}>
                  {data.conversation.state}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    Criada em
                  </p>
                  <p className="text-xs font-medium">
                    {formatDate(data.conversation.dateCreated)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs text-muted-foreground">
                    Atualizada em
                  </p>
                  <p className="text-xs font-medium">
                    {formatDate(data.conversation.dateUpdated)}
                  </p>
                </div>
                {data.conversation.messagingServiceSid && (
                  <div className="col-span-2">
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      Messaging Service SID
                    </p>
                    <p className="font-mono text-xs">
                      {data.conversation.messagingServiceSid}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Atributos
                </p>
                <JsonBlock value={data.conversation.attributes} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Participantes{" "}
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {data.participants.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum participante encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {data.participants.map((p, idx) => (
                    <div key={p.sid}>
                      {idx > 0 && <Separator className="mb-3" />}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {p.sid}
                          </span>
                          {p.identity && (
                            <Badge variant="outline" className="text-[10px]">
                              {p.identity}
                            </Badge>
                          )}
                        </div>

                        {p.messagingBinding && (
                          <div className="space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs">
                            {(p.messagingBinding as MessagingBinding).type && (
                              <div className="flex gap-2">
                                <span className="w-16 shrink-0 text-muted-foreground">
                                  Tipo
                                </span>
                                <span>
                                  {
                                    (p.messagingBinding as MessagingBinding)
                                      .type
                                  }
                                </span>
                              </div>
                            )}
                            {(p.messagingBinding as MessagingBinding)
                              .address && (
                              <div className="flex gap-2">
                                <span className="w-16 shrink-0 text-muted-foreground">
                                  Endereço
                                </span>
                                <span className="font-mono">
                                  {
                                    (p.messagingBinding as MessagingBinding)
                                      .address
                                  }
                                </span>
                              </div>
                            )}
                            {(p.messagingBinding as MessagingBinding)
                              .proxy_address && (
                              <div className="flex gap-2">
                                <span className="w-16 shrink-0 text-muted-foreground">
                                  Proxy
                                </span>
                                <span className="font-mono">
                                  {
                                    (p.messagingBinding as MessagingBinding)
                                      .proxy_address
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Adicionado:{" "}
                            </span>
                            {formatDate(p.dateCreated)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Atualizado:{" "}
                            </span>
                            {formatDate(p.dateUpdated)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                <span className="font-mono">{h.sid.slice(0, 14)}...</span>
                {h.state && <span> · {h.state}</span>}
                {h.friendlyName && (
                  <span className="italic"> · {h.friendlyName}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
