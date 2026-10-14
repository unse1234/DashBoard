"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { BagNotice } from "@/components/storefront/layout/bag-notice"
import { routes } from "@/config/routes"
import { useCheckoutQuoteQuery } from "@/hooks/storefront/checkout.queries"
import { useBag } from "@/hooks/storefront/use-bag"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { useOrderSubmission } from "@/hooks/storefront/use-order-submission"
import { useNow } from "@/hooks/use-now"
import {
  RefusedPanel,
  UnconfirmedPanel,
} from "@/screens/storefront/checkout/components/checkout-attempt-panel"
import { CheckoutDetailsPanel } from "@/screens/storefront/checkout/components/checkout-details-panel"
import {
  CheckoutOrderSummary,
  type SummaryState,
} from "@/screens/storefront/checkout/components/checkout-order-summary"
import { CheckoutPaymentPanel } from "@/screens/storefront/checkout/components/checkout-payment-panel"
import { CheckoutReviewBag } from "@/screens/storefront/checkout/components/checkout-review-bag"
import {
  toDraftLines,
  toShippingAddressRequest,
} from "@/utils/storefront/checkout-request"
import {
  describeOrderRefusal,
  type OrderRefusal,
} from "@/utils/storefront/order-refusal"

import styles from "./checkout.module.css"

// How often the quote's lifetime is checked against the clock.
const EXPIRY_CHECK_MS = 15_000

/**
 * The review before the order is placed. Everything it shows about money is the
 * server's: the bag's lines, and the checkout quote's charges and total. What
 * it keeps is what the shopper typed and what they pressed.
 */
export function CheckoutScreen() {
  const router = useRouter()
  const {
    items,
    subtotal,
    currency,
    hasIssues,
    isRestoring,
    refresh: refreshBag,
  } = useBag()
  const { draft, clear: clearDraft } = useCheckoutDraft()
  const submission = useOrderSubmission()
  const now = useNow(EXPIRY_CHECK_MS)
  // A retry is on its way (the pending attempt is not "unconfirmed" any more
  // while it is, but the shopper is still looking at its panel).
  const [retrying, setRetrying] = useState(false)

  // Prices and stock move: price the bag again when the review opens.
  useEffect(() => {
    refreshBag()
  }, [refreshBag])

  const { contact, shippingAddress } = draft
  const hasDetails = contact !== null && shippingAddress !== null
  const canQuote = hasDetails && items.length > 0 && !hasIssues && !isRestoring

  // The request is the lines and the address, so the quote is a different one
  // for a different bag or address (see `useCheckoutQuoteQuery`).
  const quoteRequest = useMemo(
    () =>
      canQuote
        ? {
            items: toDraftLines(items),
            shippingAddress: toShippingAddressRequest(shippingAddress),
          }
        : null,
    [canQuote, items, shippingAddress]
  )
  const quote = useCheckoutQuoteQuery(quoteRequest)

  const expired =
    quote.data !== undefined && Date.parse(quote.data.expiresAt) <= now
  const quoteIsCurrent =
    quote.data !== undefined && !quote.isFetching && !quote.isError
  const noAttemptPending =
    submission.status === "idle" || submission.status === "rejected"
  const canPlace = hasDetails && quoteIsCurrent && !expired && noAttemptPending

  const summaryState: SummaryState =
    items.length === 0
      ? "empty"
      : hasIssues
        ? "blocked"
        : !hasDetails
          ? "needs-details"
          : quote.isError
            ? "error"
            : quote.data
              ? "ready"
              : "loading"

  const refusal: OrderRefusal | null = submission.rejection
    ? describeOrderRefusal(submission.rejection)
    : null

  async function placeOrder() {
    if (!canPlace || !quote.data || !contact || !shippingAddress) return

    // The attempt is exactly what was quoted: the quote's own lines and token,
    // and the address that produced it.
    const outcome = await submission.submit({
      contact,
      items: toDraftLines(quote.data.items),
      shippingAddress: toShippingAddressRequest(shippingAddress),
      quoteToken: quote.data.quoteToken,
    })
    afterOutcome(outcome.type)
  }

  async function retryOrder() {
    setRetrying(true)
    try {
      afterOutcome((await submission.retry()).type)
    } finally {
      setRetrying(false)
    }
  }

  function afterOutcome(
    type: "placed" | "rejected" | "unconfirmed" | "blocked"
  ) {
    if (type === "placed") {
      clearDraft()
      router.push(routes.checkoutConfirmation)
    } else if (type === "rejected") {
      // The refusal may be about prices or stock: ask again, so what is shown
      // is what the server now says.
      refreshBag()
      void quote.refetch()
    }
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-heading">
      <h1 id="checkout-heading" className="sr-only">
        Checkout
      </h1>
      <div className={styles.content}>
        <div className={styles.sections}>
          <BagNotice />

          {(submission.status === "unconfirmed" || retrying) && (
            <UnconfirmedPanel
              retrying={retrying}
              onRetry={() => void retryOrder()}
            />
          )}
          {refusal && (
            <RefusedPanel
              refusal={refusal}
              onDismiss={submission.dismissRejection}
            />
          )}

          <CheckoutDetailsPanel draft={draft} />
          <CheckoutPaymentPanel />
          <CheckoutReviewBag items={items} />
        </div>
        <CheckoutOrderSummary
          state={summaryState}
          currency={quote.data?.currency ?? currency}
          bagSubtotal={subtotal}
          quote={quote.data}
          quoteError={quote.error}
          expired={expired}
          placing={submission.status === "submitting"}
          canPlace={canPlace}
          onPlace={() => void placeOrder()}
          onRefreshQuote={() => {
            refreshBag()
            void quote.refetch()
          }}
        />
      </div>
    </section>
  )
}
