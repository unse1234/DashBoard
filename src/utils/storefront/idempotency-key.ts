/**
 * A random UUID v4 for an order submission's `Idempotency-Key`.
 *
 * `crypto.randomUUID` exists only in secure contexts (https, or localhost), so a
 * storefront opened over plain http on a LAN address would have none; the same
 * UUID is built from `getRandomValues`, which is available everywhere.
 */
export function createIdempotencyKey(): string {
  const { crypto } = globalThis
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // Version 4, variant 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-")
}
