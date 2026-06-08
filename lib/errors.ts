export type ErrorKind =
  | "validation"
  | "auth"
  | "not_found"
  | "conflict"
  | "external"
  | "internal"

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
  message?: string
}

export function fromTwilioError(err: unknown, context: string): AppError {
  const e = err as TwilioApiError
  console.error(`[${context}]`, {
    httpStatus: e.status,
    code: e.code,
    message: e.message,
  })

  const status = e.code === 20003 ? 401 : e.status
  switch (status) {
    case 401:
    case 403:
      return new AppError("auth", "Credenciais inválidas ou sem permissão.", {
        cause: err,
      })
    case 404:
      return new AppError("not_found", "Recurso não encontrado.", {
        cause: err,
      })
    case 409:
      return new AppError("conflict", "Recurso já existe.", { cause: err })
    case 400:
      return new AppError("validation", "Parâmetros inválidos.", { cause: err })
    default:
      return new AppError(
        "external",
        "Erro na API do Twilio. Tente novamente.",
        { cause: err }
      )
  }
}

export function toApiResponse(err: unknown): Response {
  if (err instanceof AppError)
    return Response.json({ error: err.safeMessage }, { status: err.statusCode })

  console.error("[switchboard] erro não tratado:", err)
  return Response.json({ error: "Erro interno do servidor." }, { status: 500 })
}

// Safe user-visible label for Twilio errors in SSE retry messages.
export function sanitizeExternalError(err: unknown): string {
  const e = err as TwilioApiError
  const status = e.code === 20003 ? 401 : e.status
  switch (status) {
    case 401:
    case 403:
      return "credenciais inválidas ou sem permissão"
    case 404:
      return "recurso não encontrado"
    case 429:
      return "limite de requisições excedido"
    default:
      return typeof status === "number"
        ? `erro HTTP ${status}`
        : "erro na API do Twilio"
  }
}
