"use client"

import {
  AlertTriangle,
  ChevronRight,
  MessageSquareOff,
  Play,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import {
  LogOutput,
  createLogEntry,
  type LogEntry,
} from "@/components/log-output"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEnvironment } from "@/features/environments/context"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  totalClosed: number
  totalErrors: number
}

interface HistoryEntry {
  ts: number
  total: number
  closed: number
  errors: number
}

const HISTORY_KEY = "switchboard:close-history"
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

function parseParticipants(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CloseForm() {
  const { activeEnvironment } = useEnvironment()
  const [input, setInput] = React.useState("")
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const participants = parseParticipants(input)
  const MAX_ITEMS = 10
  const canSubmit =
    participants.length > 0 &&
    participants.length <= MAX_ITEMS &&
    status !== "running" &&
    !!activeEnvironment

  function addLog(level: LogEntry["level"], message: string) {
    setLogs((prev) => [...prev, createLogEntry(level, message)])
  }

  function reset() {
    setLogs([])
    setStatus("idle")
    setSummary(null)
  }

  async function runSubmit() {
    if (!canSubmit || !activeEnvironment) return

    reset()
    setStatus("running")

    try {
      const res = await fetch("/api/conversations/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
          accountSid: activeEnvironment.accountSid,
          authToken: activeEnvironment.authToken,
        }),
      })

      if (!res.ok || !res.body) {
        const text = await res.text()
        let message = "Erro ao conectar com a API"
        try {
          const json = JSON.parse(text) as { error?: string }
          if (json.error) message = json.error
        } catch {
          // ignore
        }
        addLog("error", message)
        setStatus("error")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const event of events) {
          const dataLine = event.split("\n").find((l) => l.startsWith("data:"))
          if (!dataLine) continue

          try {
            const payload = JSON.parse(dataLine.slice(5).trim()) as {
              level: LogEntry["level"]
              message: string
              done?: boolean
              totalClosed?: number
              totalErrors?: number
            }

            addLog(payload.level, payload.message)

            if (payload.done) {
              const closed = payload.totalClosed ?? 0
              const errors = payload.totalErrors ?? 0
              setSummary({ totalClosed: closed, totalErrors: errors })
              setStatus("done")
              const entry: HistoryEntry = {
                ts: Date.now(),
                total: participants.length,
                closed,
                errors,
              }
              pushHistory(entry)
              setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
            }
          } catch {
            // malformed event — skip
          }
        }
      }

      setStatus((prev) => (prev !== "done" ? "done" : prev))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado"
      addLog("error", message)
      setStatus("error")
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
        <span className="font-medium text-foreground">Fechar Conversas</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquareOff className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Fechar Conversas Ativas
          </h1>
          <p className="text-sm text-muted-foreground">
            Recebe números de telefone e fecha todas as conversas ativas
            associadas em lote
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

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="participants">
            Números de telefone{" "}
            <span className="font-normal text-muted-foreground">
              (DDD + número, sem dígito 9 — um por linha ou separados por
              vírgula)
            </span>
          </Label>
          <Textarea
            id="participants"
            placeholder={"11987654321\n21987654322\n31987654323"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[120px] font-mono text-xs"
            disabled={status === "running"}
          />
          {participants.length > 0 && (
            <p className={`text-xs ${participants.length > MAX_ITEMS ? "text-destructive" : "text-muted-foreground"}`}>
              {participants.length} número(s) detectado(s)
              {participants.length > MAX_ITEMS && ` — máximo ${MAX_ITEMS} por vez`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canSubmit} className="gap-2">
            {status === "running" ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Fechar Conversas
              </>
            )}
          </Button>

          {(logs.length > 0 || status !== "idle") && (
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={status === "running"}
              className="gap-2"
            >
              <RotateCcw className="size-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </form>

      {/* Confirmation dialog */}
      <AlertDialogRoot open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar conversas?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a fechar{" "}
              <strong>{participants.length} conversa(s)</strong> ativas para{" "}
              <strong>{participants.length} número(s)</strong>. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40"
              onClick={() => {
                setConfirmOpen(false)
                void runSubmit()
              }}
            >
              Sim, fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Summary banner */}
      {summary && status === "done" && (
        <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium">Concluído:</span>{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {summary.totalClosed} conversa(s) fechada(s)
          </span>
          {summary.totalErrors > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className="font-medium text-red-600 dark:text-red-400">
                {summary.totalErrors} erro(s)
              </span>
            </>
          )}
        </div>
      )}

      {/* Log output */}
      {logs.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Log de Operações
          </p>
          <LogOutput entries={logs} />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8 space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Últimas operações
          </p>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                {h.total} número(s) · {h.closed} fechada(s)
                {h.errors > 0 && (
                  <span className="text-red-500 dark:text-red-400">
                    {" "}
                    · {h.errors} erro(s)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
