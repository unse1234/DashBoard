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
