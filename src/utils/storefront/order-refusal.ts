import type { ApiError } from "@/lib/api/api-error"
import { describeApiError } from "@/lib/api/api-error"

/** Where the shopper should go to put right what the API refused. */
export type RefusalRemedy =
  /** Nothing to fix: the prices were renewed, and the order can be placed again. */
  | "review"
  /** Something in the bag cannot be bought as it is. */
  | "bag"
  /** The contact or delivery details are not acceptable. */
  | "details"

export type OrderRefusal = {
  message: string
  remedy: RefusalRemedy
}

/**
 * What to tell a shopper whose order the API definitively refused (nothing was
 * placed). The API's own wording is kept where it is already written for
 * shoppers; what changes is that a stale quote is explained as something that
 * was put right, not as a failure.
 */
export function describeOrderRefusal(error: ApiError): OrderRefusal {
  switch (error.code) {
    case "QUOTE_CHANGED": {
      const reason = error.details.reason
      if (reason === "QUOTE_EXPIRED") {
        return {
          message:
            "Your price quote expired while you were checking out. The current prices are below: review them, then place your order again.",
          remedy: "review",
        }
      }
      if (reason === "PRICES_CHANGED" || reason === "TOTAL_CHANGED") {
        return {
          message:
            "Prices changed while you were checking out. The current prices are below: review them, then place your order again.",
          remedy: "review",
        }
      }
      return {
        message:
          "Your order changed since you reviewed it. Review it again, then place your order.",
        remedy: "review",
      }
    }
    case "PRODUCT_UNAVAILABLE":
    case "INSUFFICIENT_STOCK":
    case "INVALID_BAG":
    case "ORDER_TOO_LARGE":
      return { message: error.message, remedy: "bag" }
    case "UNSUPPORTED_DESTINATION":
      return { message: error.message, remedy: "details" }
    case "IDEMPOTENCY_CONFLICT":
      return {
        message: "This order could not be placed. Please try again.",
        remedy: "review",
      }
  }

  // A validation error has no code: it lists the fields that were not accepted.
  if (error.status === 400 && error.messages.length > 0) {
    return {
      message: `Please check your details: ${error.messages.join("; ")}`,
      remedy: "details",
    }
  }
  return { message: describeApiError(error), remedy: "review" }
}
