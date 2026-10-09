"use client"

import { InputActions } from "@/components/input-actions"

import { ActionBar } from "@/components/action-bar"

import { ActionButton } from "@/components/action-button"

import { CheckCircle2, Eye, EyeOff, Loader2, WifiOff } from "lucide-react"
import * as React from "react"

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

type TestState = "idle" | "loading" | "success" | "error"

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
  const [testState, setTestState] = React.useState<TestState>("idle")
  const [testError, setTestError] = React.useState<string | null>(null)
  const testAbortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => testAbortRef.current?.abort(), [])

  const credentialsComplete =
    /^AC[a-f0-9]{32}$/i.test(form.accountSid.trim()) &&
    form.authToken.trim().length === 32

  function handleChange(field: keyof FormState, value: string) {
    testAbortRef.current?.abort()
    testAbortRef.current = null
    setForm((prev) => ({ ...prev, [field]: value }))
    setTestState("idle")
    setTestError(null)
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

  async function handleTest() {
    const credErrors: Record<string, string> = {}
    if (!form.accountSid.trim()) {
      credErrors.accountSid = strings.environments.form.accountSidRequired
    } else if (!/^AC[a-f0-9]{32}$/i.test(form.accountSid.trim())) {
      credErrors.accountSid = strings.environments.form.accountSidInvalid
    }
    if (!form.authToken.trim()) {
      credErrors.authToken = strings.environments.form.authTokenRequired
    } else if (form.authToken.trim().length !== 32) {
      credErrors.authToken = strings.environments.form.authTokenInvalid
    }
    if (Object.keys(credErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...credErrors }))
      return
    }

    setTestState("loading")
    setTestError(null)
    const controller = new AbortController()
    testAbortRef.current?.abort()
    testAbortRef.current = controller

    try {
      const res = await fetch("/api/environments/verify-twilio-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: form.accountSid.trim(),
          authToken: form.authToken.trim(),
        }),
        signal: controller.signal,
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (controller.signal.aborted || testAbortRef.current !== controller)
        return
      if (res.ok && json.ok) {
        setTestState("success")
      } else {
        setTestState("error")
        setTestError(json.error ?? strings.environments.form.testError)
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
      )
        return
      setTestState("error")
      setTestError(strings.common.networkError)
    } finally {
      if (testAbortRef.current === controller) testAbortRef.current = null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="env-name">{strings.environments.form.nameLabel}</Label>
        <Input
          id="env-name"
          aria-describedby={errors.name ? "env-name-error" : undefined}
          placeholder={strings.environments.form.namePlaceholder}
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p id="env-name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-sid">
          {strings.environments.form.accountSidLabel}
        </Label>
        <Input
          id="env-sid"
          aria-describedby={
            errors.accountSid ? "env-sid-error env-sid-hint" : "env-sid-hint"
          }
          placeholder={strings.common.placeholders.accountSid}
          value={form.accountSid}
          onChange={(e) => handleChange("accountSid", e.target.value)}
          className="font-mono text-sm"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={!!errors.accountSid}
        />
        {errors.accountSid && (
          <p id="env-sid-error" className="text-xs text-destructive">
            {errors.accountSid}
          </p>
        )}
        <p id="env-sid-hint" className="text-xs text-muted-foreground">
          {strings.environments.form.accountSidHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="env-token">
          {strings.environments.form.authTokenLabel}
        </Label>
        <InputActions>
          <div className="min-w-0 flex-1">
            <div className="relative flex items-center">
              <Input
                id="env-token"
                aria-describedby={
                  errors.authToken
                    ? "env-token-error env-token-hint"
                    : "env-token-hint"
                }
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
                className="absolute right-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={
                  showToken
                    ? strings.environments.form.hideTokenAriaLabel
                    : strings.environments.form.showTokenAriaLabel
                }
              >
                {showToken ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <ActionBar className="sm:max-w-56">
            <ActionButton action="save" type="submit">
              {strings.environments.form.saveButton}
            </ActionButton>
            <ActionButton action="cancel" type="button" onClick={onCancel}>
              {strings.environments.form.cancelButton}
            </ActionButton>
            <Button
              aria-busy={testState === "loading"}
              type="button"
              variant="outline"

              disabled={!credentialsComplete || testState === "loading"}
              onClick={handleTest}
              className="gap-1.5"
            >
              {testState === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <span className="size-3.5" />
              )}
              {testState === "loading"
                ? strings.environments.form.testingButton
                : strings.environments.form.testButton}
            </Button>
          </ActionBar>
        </InputActions>
        {errors.authToken && (
          <p id="env-token-error" className="text-xs text-destructive">
            {errors.authToken}
          </p>
        )}
        <p id="env-token-hint" className="text-xs text-muted-foreground">
          {strings.environments.form.authTokenHint}
        </p>
      </div>

      {/* Test credentials */}
      <div className="flex flex-wrap items-center gap-3">
        {testState === "success" && (
          <span
            role="status"
            className="flex items-center gap-1.5 text-xs font-medium text-success dark:text-success"
          >
            <CheckCircle2 className="size-3.5" />
            {strings.environments.form.testSuccess}
          </span>
        )}
        {testState === "error" && (
          <span
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-destructive"
          >
            <WifiOff className="size-3.5" />
            {testError ?? strings.environments.form.testError}
          </span>
        )}
      </div>
    </form>
  )
}
