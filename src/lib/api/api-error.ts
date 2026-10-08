/** Status used when no HTTP response was received at all. */
export const NETWORK_ERROR_STATUS = 0

/**
 * A failed API call. `status` is the HTTP status (`NETWORK_ERROR_STATUS` when
 * the server could not be reached) and `messages` holds every message the API
 * returned: one for most errors, several for validation errors.
 */
export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? "Something went wrong. Please try again.")
    this.name = "ApiError"
    this.status = status
    this.messages = messages
  }

  get isNetworkError() {
    return this.status === NETWORK_ERROR_STATUS
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Reads the `{ statusCode, message, error }` body that NestJS returns. */
export function parseErrorMessages(body: unknown): string[] {
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
