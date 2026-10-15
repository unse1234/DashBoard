/** Status used when no HTTP response was received at all. */
export const NETWORK_ERROR_STATUS = 0

/** A request exhausted its deadline; retrying automatically would prolong loading. */
export const REQUEST_TIMEOUT_CODE = "REQUEST_TIMEOUT"

/**
 * A failed API call. `status` is the HTTP status (`NETWORK_ERROR_STATUS` when
 * the server could not be reached) and `messages` holds every message the API
 * returned: one for most errors, several for validation errors.
 */
export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]
  /**
   * The rest of the error body: the machine-readable `code` of a business
   * refusal and whatever fields it carries (`productId`, `issues`, `reason`).
   * Empty for errors that carry only a message.
   */
  readonly details: Record<string, unknown>

  constructor(
    status: number,
    messages: string[],
    details: Record<string, unknown> = {}
  ) {
    super(messages[0] ?? "Something went wrong. Please try again.")
    this.name = "ApiError"
    this.status = status
    this.messages = messages
    this.details = details
  }

  /** The API's business error code (`QUOTE_CHANGED`, `INSUFFICIENT_STOCK`, ...), if it sent one. */
  get code(): string | null {
    return typeof this.details.code === "string" ? this.details.code : null
  }

  get isNetworkError() {
    return this.status === NETWORK_ERROR_STATUS
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// A request that asked for plain text (a CSV download) gets its error body back
// unparsed. Only a short JSON object is worth reading; anything else is not an
// API error body.
const MAX_ERROR_TEXT_LENGTH = 10_000

function parseJsonText(text: string): unknown {
  if (
    text.length > MAX_ERROR_TEXT_LENGTH ||
    !text.trimStart().startsWith("{")
  ) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Reads the `{ statusCode, message, error }` body that NestJS returns. */
export function parseErrorMessages(rawBody: unknown): string[] {
  const body = typeof rawBody === "string" ? parseJsonText(rawBody) : rawBody

  if (typeof body !== "object" || body === null || !("message" in body)) {
    return []
  }

  const { message } = body
  if (typeof message === "string") return [message]
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === "string")
  }
  return []
}

/**
 * Everything in a NestJS error body except the three fields every error has
 * (`statusCode`, `error`, `message`): a business `code` and its extra fields.
 */
export function parseErrorDetails(rawBody: unknown): Record<string, unknown> {
  const body = typeof rawBody === "string" ? parseJsonText(rawBody) : rawBody
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {}
  }

  const details = { ...(body as Record<string, unknown>) }
  delete details.statusCode
  delete details.error
  delete details.message
  return details
}

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again."

/**
 * Message safe to show to users. Rate limiting and server faults get friendly
 * text; other API messages (e.g. "Invalid email or password") are already
 * written for end users.
 */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_ERROR_MESSAGE
  if (error.status === 429) {
    return "Too many attempts. Please wait a minute and try again."
  }
  if (error.status >= 500) {
    return "Something went wrong on our side. Please try again shortly."
  }
  return error.message
}
