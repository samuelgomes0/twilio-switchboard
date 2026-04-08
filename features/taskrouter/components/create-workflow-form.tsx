"use client"

import {
  AlertTriangle,
  ChevronRight,
  GitBranch,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEnvironment } from "@/features/environments/context"

type Status = "idle" | "running" | "done" | "error"

interface Summary {
  workflowSid: string
  workflowName: string
  totalFilters: number
}

interface HistoryEntry {
  ts: number
  workspaceSid: string
  workflowName: string
  workflowSid: string
  totalFilters: number
}

const HISTORY_KEY = "switchboard:create-workflow-history"
const WS_SIDS_KEY = "switchboard:workspace-sids"
const WF_NAMES_KEY = "switchboard:workflow-names"
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

export function CreateWorkflowForm() {
  const { activeEnvironment } = useEnvironment()
  const [workspaceSid, setWorkspaceSid] = React.useState("")
  const [workflowName, setWorkflowName] = React.useState("")
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [status, setStatus] = React.useState<Status>("idle")
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryEntry[]>([])

  React.useEffect(() => {
    setHistory(readHistory())
  }, [])

  const canSubmit =
    workspaceSid.trim().length > 0 &&
    workflowName.trim().length > 0 &&
    csvFile !== null &&
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
    if (!canSubmit || !activeEnvironment || !csvFile) return

    reset()
    setStatus("running")

    let csvContent: string
    try {
      csvContent = await csvFile.text()
    } catch {
      addLog("error", "Não foi possível ler o arquivo CSV.")
      setStatus("error")
      return
    }

    try {
      const res = await fetch("/api/taskrouter/create-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSid: workspaceSid.trim(),
          workflowName: workflowName.trim(),
          csvContent,
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
              workflowSid?: string
              workflowName?: string
              totalFilters?: number
            }

            addLog(payload.level, payload.message)

            if (payload.done) {
              if (payload.workflowSid) {
                const wfSid = payload.workflowSid
                const wfName = payload.workflowName ?? workflowName.trim()
                const totalFilters = payload.totalFilters ?? 0
                setSummary({
                  workflowSid: wfSid,
                  workflowName: wfName,
                  totalFilters,
                })
                setStatus("done")
                const entry: HistoryEntry = {
                  ts: Date.now(),
                  workspaceSid: workspaceSid.trim(),
                  workflowName: wfName,
                  workflowSid: wfSid,
                  totalFilters,
                }
                pushHistory(entry)
                setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
              } else {
                setStatus("error")
              }
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
          href="/taskrouter"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          TaskRouter
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">Criar Workflow</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <GitBranch className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Criar Workflow
          </h1>
          <p className="text-sm text-muted-foreground">
            Lê um CSV com regras de negócio e filas Twilio para gerar filtros e
            criar o workflow no TaskRouter
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
        {/* Workspace SID */}
        <div className="space-y-2">
          <Label htmlFor="workspaceSid">Workspace SID</Label>
          <StoredInput
            id="workspaceSid"
            storageKey={WS_SIDS_KEY}
            value={workspaceSid}
            onChange={setWorkspaceSid}
            placeholder="WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            disabled={status === "running"}
          />
        </div>

        {/* Workflow name */}
        <div className="space-y-2">
          <Label htmlFor="workflowName">Nome do Workflow</Label>
          <StoredInput
            id="workflowName"
            storageKey={WF_NAMES_KEY}
            value={workflowName}
            onChange={setWorkflowName}
            placeholder="ex: Roteamento Principal"
            disabled={status === "running"}
            className="font-sans text-sm placeholder:font-sans"
          />
        </div>

        {/* CSV file */}
        <div className="space-y-2">
          <Label htmlFor="csvFile">Arquivo CSV</Label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            disabled={status === "running"}
            className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
          />
          {csvFile && (
            <p className="text-xs text-muted-foreground">
              Arquivo selecionado: {csvFile.name}
            </p>
          )}
        </div>

        {/* Actions */}
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
                Criar Workflow
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
            <AlertDialogTitle>Criar workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a criar o workflow{" "}
              <strong>&quot;{workflowName}&quot;</strong> no workspace{" "}
              <strong className="font-mono">{workspaceSid}</strong>. Os filtros
              serão lidos do arquivo: <strong>{csvFile?.name ?? ""}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                void runSubmit()
              }}
            >
              Criar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogRoot>

      {/* Summary banner */}
      {summary && status === "done" && (
        <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Workflow criado: {summary.workflowName}
          </span>{" "}
          &middot;{" "}
          <span className="font-mono text-muted-foreground">
            {summary.workflowSid}
          </span>{" "}
          &middot;{" "}
          <span className="text-muted-foreground">
            {summary.totalFilters} filtro(s)
          </span>
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
            Últimas criações
          </p>
          <ul className="space-y-0.5">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="tabular-nums">{fmtTs(h.ts)}</span>
                {" — "}
                <span>{h.workflowName}</span>
                {" · "}
                <span className="font-mono">
                  {h.workflowSid.slice(0, 10)}...
                </span>
                {" · "}
                {h.totalFilters} filtro(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
