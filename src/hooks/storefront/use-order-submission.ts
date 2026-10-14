"use client"

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import { useBag } from "@/hooks/storefront/use-bag"
import { customerKeys } from "@/hooks/customers/customer.keys"
import { orderKeys } from "@/hooks/orders/order.keys"
import { productKeys } from "@/hooks/products/product.keys"
import { isApiError, type ApiError } from "@/lib/api/api-error"
import { placeOrder } from "@/services/storefront/checkout.api"
import type {
  OrderAttempt,
  OrderConfirmation,
  PlaceOrderRequest,
} from "@/types/storefront/checkout.types"
import { createIdempotencyKey } from "@/utils/storefront/idempotency-key"
import {
  clearAttempt,
  readAttemptSnapshot,
  saveAttempt,
  saveConfirmation,
  subscribeToOrderSession,
  toAttempt,
} from "@/utils/storefront/order-session"

export type SubmissionStatus =
  /** Nothing is on its way; a new order may be placed. */
  | "idle"
  /** The request is in flight. */
  | "submitting"
  /**
   * The outcome is not known (the connection dropped, the server failed, the
   * request timed out): the order may or may not exist. The attempt is kept,
   * and sending it again is safe.
   */
  | "unconfirmed"
  /** The API refused the order. Nothing was placed and nothing is pending. */
  | "rejected"

export type SubmissionOutcome =
  | { type: "placed"; confirmation: OrderConfirmation }
  | { type: "rejected"; error: ApiError }
  | { type: "unconfirmed"; error: unknown }
  /** Nothing was sent: another attempt is on its way or awaiting an answer. */
  | { type: "blocked" }

/**
 * Whether the API's answer proves that no order was placed. A 4xx other than
 * "slow down" and "timed out" is its considered refusal of this request, and an
 * order is only ever created by a 201. Everything else says nothing: the
 * connection dropped, the server failed, or it asked for the request to be
 * sent again.
 */
function isDefinitiveRefusal(error: unknown): error is ApiError {
  return (
    isApiError(error) &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 429
  )
}

/**
 * Places the guest's order and keeps it from ever being placed twice.
 *
 * An attempt is frozen when it is submitted (the request, the quote token and a
 * random idempotency key) and written to `sessionStorage` *before* it is sent.
 * Until the outcome is known it is the only thing that may be sent: a lost
 * connection or a reload leaves it `unconfirmed`, and `retry` sends exactly it
 * again, which the server answers with the original order if there was one.
 * The attempt is forgotten only when the order is confirmed or the API
 * definitively refused it.
 *
 * On success the receipt is stored for the confirmation page, the bag is
 * emptied (no request: nothing is calculated), and the queries that show orders,
 * customers and stock are invalidated for anyone using the dashboard in this
 * browser.
 */
export function useOrderSubmission() {
  const queryClient = useQueryClient()
  const { clear: clearBag } = useBag()

  const storedAttempt = useSyncExternalStore(
    subscribeToOrderSession,
    readAttemptSnapshot,
    // The server has no session storage, and the first client render must
    // match it.
    () => null
  )
  const attempt = useMemo(() => toAttempt(storedAttempt), [storedAttempt])

  const [submitting, setSubmitting] = useState(false)
  const [lastError, setLastError] = useState<unknown>(null)
  const [rejection, setRejection] = useState<ApiError | null>(null)
  // A second click in the same tick sees state that has not re-rendered yet.
  const inFlight = useRef(false)

  const send = useCallback(
    async (toSend: OrderAttempt): Promise<SubmissionOutcome> => {
      if (inFlight.current) return { type: "blocked" }
      inFlight.current = true
      setSubmitting(true)
      setLastError(null)
      setRejection(null)

      try {
        const receipt = await placeOrder(toSend)
        const { contact, shippingAddress } = toSend.request
        const confirmation: OrderConfirmation = {
          receipt,
          delivery: {
            contactName: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: shippingAddress,
          },
        }

        saveConfirmation(confirmation)
        clearAttempt()
        clearBag()
        for (const queryKey of [
          orderKeys.all,
          customerKeys.all,
          productKeys.all,
          catalogKeys.all,
        ]) {
          void queryClient.invalidateQueries({ queryKey })
        }
        return { type: "placed", confirmation }
      } catch (error) {
        if (isDefinitiveRefusal(error)) {
          clearAttempt()
          setRejection(error)
          return { type: "rejected", error }
        }
        // The attempt stays: it may have been placed.
        setLastError(error)
        return { type: "unconfirmed", error }
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    },
    [clearBag, queryClient]
  )

  /** Freezes `request` as a new attempt and sends it, unless one is pending. */
  const submit = useCallback(
    (request: PlaceOrderRequest): Promise<SubmissionOutcome> => {
      if (inFlight.current || attempt)
        return Promise.resolve({ type: "blocked" })
      const next: OrderAttempt = { key: createIdempotencyKey(), request }
      saveAttempt(next)
      return send(next)
    },
    [attempt, send]
  )

  /** Sends the pending attempt again, exactly as it was. */
  const retry = useCallback((): Promise<SubmissionOutcome> => {
    if (!attempt) return Promise.resolve({ type: "blocked" })
    return send(attempt)
  }, [attempt, send])

  const dismissRejection = useCallback(() => setRejection(null), [])

  const status: SubmissionStatus = submitting
    ? "submitting"
    : attempt
      ? "unconfirmed"
      : rejection
        ? "rejected"
        : "idle"

  return {
    status,
    /** The order awaiting an answer, if any; it survives a reload of the tab. */
    attempt,
    /** Why the last send was not confirmed, while `unconfirmed`. */
    error: lastError,
    /** Why the API refused the order, while `rejected`. */
    rejection,
    submit,
    retry,
    dismissRejection,
  }
}
