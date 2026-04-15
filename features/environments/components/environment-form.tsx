"use client"

import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { strings } from "@/lib/strings"

export interface FormState {
  name: string
  accountSid: string
  authToken: string
}

const EMPTY_FORM: FormState = { name: "", accountSid: "", authToken: "" }

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = strings.environments.form.nameRequired
  }
  if (!form.accountSid.trim()) {
    errors.accountSid = strings.environments.form.accountSidRequired
  } else if (!/^AC[a-f0-9]{32}$/i.test(form.accountSid.trim())) {
    errors.accountSid = strings.environments.form.accountSidInvalid
  }
  if (!form.authToken.trim()) {
    errors.authToken = strings.environments.form.authTokenRequired
  } else if (form.authToken.trim().length !== 32) {
    errors.authToken = strings.environments.form.authTokenInvalid
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
        <Label htmlFor="env-name">{strings.environments.form.nameLabel}</Label>
        <Input
          id="env-name"
          placeholder={strings.environments.form.namePlaceholder}
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-sid">{strings.environments.form.accountSidLabel}</Label>
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
          {strings.environments.form.accountSidHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-token">{strings.environments.form.authTokenLabel}</Label>
        <div className="relative flex items-center">
          <Input
            id="env-token"
            type={showToken ? "text" : "password"}
            placeholder={strings.environments.form.authTokenPlaceholder}
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
            aria-label={showToken ? strings.environments.form.hideTokenAriaLabel : strings.environments.form.showTokenAriaLabel}
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
          {strings.environments.form.authTokenHint}
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5">
          <Check className="size-3.5" />
          {strings.environments.form.saveButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-1.5"
        >
          <X className="size-3.5" />
          {strings.environments.form.cancelButton}
        </Button>
      </div>
    </form>
  )
}
