import { PLACE_ORDER_TIMEOUT_MS } from "@/constants/storefront.constants"
import { apiClient } from "@/lib/api/axios"
import type {
  CheckoutQuote,
  CheckoutQuoteRequest,
  OrderAttempt,
  OrderReceipt,
} from "@/types/storefront/checkout.types"

// Both are public: `skipAuth` keeps a staff token off them, and keeps a 401 from
// starting a session refresh there is no session for.

/**
 * What the bag costs going to this address: priced lines, the charges (zero in
 * this demo, and the server says so), the total, and a signed `quoteToken`.
 * Creates no customer, order or reservation. Refused with `409` (and `issues`)
 * when a line cannot be bought, `400 UNSUPPORTED_DESTINATION` outside Pakistan.
 */
export async function quoteCheckout(
  request: CheckoutQuoteRequest,
  signal?: AbortSignal
): Promise<CheckoutQuote> {
  const { data } = await apiClient.post<CheckoutQuote>(
    "/storefront/checkout/quote",
    request,
    { signal, skipAuth: true }
  )
  return data
}

/**
 * Places the order described by `attempt`. The attempt's key makes it safe to
 * send again: the same key with the same request returns the order already
 * placed, even after the quote expired or the prices moved, and never takes
 * stock twice. A request that outlives the timeout fails like a lost
 * connection, and the caller treats both as "outcome unknown".
 */
export async function placeOrder(
  attempt: OrderAttempt,
  signal?: AbortSignal
): Promise<OrderReceipt> {
  const { data } = await apiClient.post<OrderReceipt>(
    "/storefront/orders",
    attempt.request,
    {
      headers: { "Idempotency-Key": attempt.key },
      timeout: PLACE_ORDER_TIMEOUT_MS,
      signal,
      skipAuth: true,
    }
  )
  return data
}
