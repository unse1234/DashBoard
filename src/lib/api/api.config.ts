const DEVELOPMENT_API_URL = "http://localhost:3001"

function resolveApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return configured.replace(/\/+$/, "")

  if (process.env.NODE_ENV === "production") {
    // Inlined at build time, so a missing value must fail the build rather
    // than silently ship a bundle that calls localhost.
    throw new Error("NEXT_PUBLIC_API_URL is not set.")
  }
  return DEVELOPMENT_API_URL
}

/** Base URL of the backend API, without a trailing slash. */
export const API_URL = resolveApiUrl()
