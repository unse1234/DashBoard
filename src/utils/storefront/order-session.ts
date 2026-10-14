import type {
  OrderAttempt,
  OrderConfirmation,
  ShippingAddressRequest,
} from "@/types/storefront/checkout.types"

/**
 * What a tab remembers of an order, and nothing else: the attempt that is on
 * its way (so a reload or a lost connection can finish it instead of starting a
 * second order) and the receipt of the one that was placed. `sessionStorage`,
 * so it ends with the tab, and never anything about a card: there is none.
 */
export const ATTEMPT_STORAGE_KEY = "ecom-dash.storefront.pending-order.v1"
export const CONFIRMATION_STORAGE_KEY = "ecom-dash.storefront.confirmation.v1"

// The API accepts an Idempotency-Key of 8 to 100 of these.
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/

type Listener = () => void
const listeners = new Set<Listener>()

/** For `useSyncExternalStore`: called when this tab saves or clears either record. */
export function subscribeToOrderSession(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    // Unavailable storage only costs the reload safety net.
  }
  notify()
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === "string"
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

function isAddress(value: unknown): value is ShippingAddressRequest {
  return (
    isRecord(value) &&
    isString(value.recipientName) &&
    isString(value.addressLine1) &&
    (value.addressLine2 === undefined || isString(value.addressLine2)) &&
    isString(value.city) &&
    isString(value.region) &&
    (value.postalCode === undefined || isString(value.postalCode)) &&
    isString(value.country)
  )
}

function isDraftLines(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (line) =>
        isRecord(line) &&
        isString(line.productId) &&
        Number.isInteger(line.quantity)
    )
  )
}

function parseAttempt(raw: string | null): OrderAttempt | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || !isString(value.key)) return null
    if (!KEY_PATTERN.test(value.key)) return null
    const { request } = value
    if (!isRecord(request)) return null
    const { contact } = request
    if (
      !isRecord(contact) ||
      !isString(contact.name) ||
      !isString(contact.email) ||
      !isString(contact.phone) ||
      !isDraftLines(request.items) ||
      !isAddress(request.shippingAddress) ||
      !isString(request.quoteToken)
    ) {
      return null
    }
    return value as unknown as OrderAttempt
  } catch {
    return null
  }
}

function parseConfirmation(raw: string | null): OrderConfirmation | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return null
    const { receipt, delivery } = value
    if (
      !isRecord(receipt) ||
      !isString(receipt.id) ||
      !/^ORD-\d+$/.test(receipt.id) ||
      !isString(receipt.createdAt) ||
      !Array.isArray(receipt.items) ||
      !isNumber(receipt.total) ||
      !isRecord(delivery) ||
      !isString(delivery.contactName) ||
      !isString(delivery.email) ||
      !isString(delivery.phone) ||
      !isAddress(delivery.address)
    ) {
      return null
    }
    return value as unknown as OrderConfirmation
  } catch {
    return null
  }
}

// Snapshots are the raw strings: equal while nothing changed, so
// `useSyncExternalStore` does not re-render for nothing.

export const readAttemptSnapshot = () => read(ATTEMPT_STORAGE_KEY)
export const readConfirmationSnapshot = () => read(CONFIRMATION_STORAGE_KEY)

export const toAttempt = parseAttempt
export const toConfirmation = parseConfirmation

export function saveAttempt(attempt: OrderAttempt) {
  write(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt))
}

/** The outcome is known: the order was placed, or it definitely was not. */
export function clearAttempt() {
  write(ATTEMPT_STORAGE_KEY, null)
}

export function saveConfirmation(confirmation: OrderConfirmation) {
  write(CONFIRMATION_STORAGE_KEY, JSON.stringify(confirmation))
}

export function clearConfirmation() {
  write(CONFIRMATION_STORAGE_KEY, null)
}
