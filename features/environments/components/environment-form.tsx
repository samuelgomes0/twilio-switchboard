"use client"

import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface FormState {
  name: string
  accountSid: string
  authToken: string
}

const EMPTY_FORM: FormState = { name: "", accountSid: "", authToken: "" }

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = "Nome obrigatório"
  }
  if (!form.accountSid.trim()) {
    errors.accountSid = "Account SID obrigatório"
  } else if (!/^AC[a-f0-9]{32}$/i.test(form.accountSid.trim())) {
    errors.accountSid = "Deve começar com AC e ter 34 caracteres"
  }
  if (!form.authToken.trim()) {
    errors.authToken = "Auth Token obrigatório"
  } else if (form.authToken.trim().length !== 32) {
    errors.authToken = "Deve ter exatamente 32 caracteres"
  }
  return errors
}

export function EnvironmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: FormState
  onSave: (form: FormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = React.useState<FormState>(initial ?? EMPTY_FORM)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showToken, setShowToken] = React.useState(false)

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave({
      name: form.name.trim(),
      accountSid: form.accountSid.trim(),
      authToken: form.authToken.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="env-name">Nome do ambiente</Label>
        <Input
          id="env-name"
          placeholder="ex: Produção, Homologação"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-sid">Account SID</Label>
        <Input
          id="env-sid"
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={form.accountSid}
          onChange={(e) => handleChange("accountSid", e.target.value)}
          className="font-mono text-sm"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={!!errors.accountSid}
        />
        {errors.accountSid && (
          <p className="text-xs text-destructive">{errors.accountSid}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Começa com AC, seguido de 32 caracteres hex — total 34 chars
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-token">Auth Token</Label>
        <div className="relative flex items-center">
          <Input
            id="env-token"
            type={showToken ? "text" : "password"}
            placeholder="32 caracteres"
            value={form.authToken}
            onChange={(e) => handleChange("authToken", e.target.value)}
            className="pr-10 font-mono text-sm"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-invalid={!!errors.authToken}
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showToken ? "Ocultar token" : "Revelar token"}
          >
            {showToken ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.authToken && (
          <p className="text-xs text-destructive">{errors.authToken}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Exatamente 32 caracteres
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5">
          <Check className="size-3.5" />
          Salvar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-1.5"
        >
          <X className="size-3.5" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
