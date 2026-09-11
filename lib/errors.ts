import { strings } from "@/lib/strings"

export type ErrorKind =
  "validation" | "auth" | "not_found" | "conflict" | "external" | "internal"

const STATUS_MAP: Record<ErrorKind, number> = {
  validation: 400,
  auth: 401,
  not_found: 404,
  conflict: 409,
  external: 500,
  internal: 500,
}

export class AppError extends Error {
  readonly kind: ErrorKind
  readonly statusCode: number
  readonly safeMessage: string

  constructor(
    kind: ErrorKind,
    safeMessage: string,
    options?: { cause?: unknown }
  ) {
    super(safeMessage, options)
    this.name = "AppError"
    this.kind = kind
    this.safeMessage = safeMessage
    this.statusCode = STATUS_MAP[kind]
  }
}

interface TwilioApiError {
  status?: number
  code?: number
}

function getExternalErrorMetadata(err: unknown): TwilioApiError {
  if (typeof err !== "object" || err === null) return {}
  return {
    status:
      "status" in err &&
      typeof err.status === "number" &&
      Number.isFinite(err.status)
        ? err.status
        : undefined,
    code:
      "code" in err && typeof err.code === "number" && Number.isFinite(err.code)
        ? err.code
        : undefined,
  }
}

export function fromTwilioError(err: unknown, context: string): AppError {
  const e = getExternalErrorMetadata(err)
  console.error(`[${context}]`, {
    httpStatus: e.status,
    code: e.code,
  })

  const status = e.code === 20003 ? 401 : e.status
  switch (status) {
    case 401:
    case 403:
      return new AppError("auth", strings.common.errors.auth, {
        cause: err,
      })
    case 404:
      return new AppError("not_found", strings.common.errors.notFound, {
        cause: err,
      })
    case 409:
      return new AppError("conflict", strings.common.errors.conflict, {
        cause: err,
      })
    case 400:
      return new AppError("validation", strings.common.errors.validation, {
        cause: err,
      })
    default:
      return new AppError("external", strings.common.errors.external, {
        cause: err,
      })
  }
}

export function toApiResponse(err: unknown): Response {
  if (err instanceof AppError)
    return Response.json({ error: err.safeMessage }, { status: err.statusCode })

  console.error("[switchboard]", getExternalErrorMetadata(err))
  return Response.json(
    { error: strings.common.errors.internal },
    { status: 500 }
  )
}

// Safe user-visible label for Twilio errors in SSE retry messages.
export function sanitizeExternalError(err: unknown): string {
  const e = getExternalErrorMetadata(err)
  const status = e.code === 20003 ? 401 : e.status
  switch (status) {
    case 401:
    case 403:
      return strings.common.errors.retryAuth
    case 404:
      return strings.common.errors.retryNotFound
    case 429:
      return strings.common.errors.rateLimit
    default:
      return typeof status === "number"
        ? strings.common.errors.http(status)
        : strings.common.errors.retryExternal
  }
}
