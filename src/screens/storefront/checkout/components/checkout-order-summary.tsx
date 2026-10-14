import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { routes } from "@/config/routes"
import { describeApiError } from "@/lib/api/api-error"
import type { CheckoutQuote } from "@/types/storefront/checkout.types"
import type { StorefrontCurrency } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

import styles from "../checkout.module.css"

/** What stands between the shopper and a total, when there is not one yet. */
export type SummaryState =
  "empty" | "blocked" | "needs-details" | "loading" | "error" | "ready"

type CheckoutOrderSummaryProps = {
  state: SummaryState
  currency: StorefrontCurrency
  /** The bag's own subtotal, shown until a quote prices the order. */
  bagSubtotal: number
  quote: CheckoutQuote | undefined
  quoteError: unknown
  /** The quote's lifetime has run out. */
  expired: boolean
  placing: boolean
  canPlace: boolean
  onPlace: () => void
  onRefreshQuote: () => void
}

const NOTES: Partial<Record<SummaryState, string>> = {
  empty: "Your bag is empty.",
  blocked:
    "Some items in your bag can’t be bought as they are. Review your bag to continue.",
  "needs-details":
    "Add your shipping address and contact details to see your total.",
  loading: "Calculating your total…",
}

/**
 * The order's price as the server quoted it: every figure, and the total, is
 * the quote's. Without one there is no total to show, and none is invented:
 * the charges say they are not yet known.
 */
export function CheckoutOrderSummary({
  state,
  currency,
  bagSubtotal,
  quote,
  quoteError,
  expired,
  placing,
  canPlace,
  onPlace,
  onRefreshQuote,
}: CheckoutOrderSummaryProps) {
  const priced = state === "ready" && quote
  const money = (amount: number) => formatStorefrontPrice(amount, currency)

  return (
    <aside
      className={styles.summaryAside}
      aria-labelledby="order-summary-heading"
    >
      <div className={styles.summaryPanel}>
        <h2 id="order-summary-heading">Order Summary</h2>
        <dl className={styles.summaryRows}>
          <div>
            <dt>Items:</dt>
            <dd>{money(priced ? quote.subtotal : bagSubtotal)}</dd>
          </div>
          <div>
            <dt>Shipping:</dt>
            <dd>{priced ? money(quote.shipping) : "—"}</dd>
          </div>
          <div>
            <dt>Tax:</dt>
            <dd>{priced ? money(quote.tax) : "—"}</dd>
          </div>
          <div>
            <dt>Discount:</dt>
            <dd>{priced ? money(quote.discount) : "—"}</dd>
          </div>
        </dl>
        <Separator className={styles.summaryDivider} />
        <dl className={styles.orderTotal}>
          <div>
            <dt>Order Total:</dt>
            <dd aria-live="polite" aria-atomic="true">
              {priced ? money(quote.total) : "—"}
            </dd>
          </div>
        </dl>
        <Separator className={styles.totalDivider} />

        {NOTES[state] && (
          <p role="status" className={styles.summaryNote}>
            {NOTES[state]}
          </p>
        )}
        {state === "blocked" && (
          <Link href={routes.bag} className={styles.summaryLink}>
            Review your bag
          </Link>
        )}
        {state === "error" && (
          <div role="alert" className={styles.summaryProblem}>
            <p>{describeApiError(quoteError)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshQuote}
            >
              Try again
            </Button>
          </div>
        )}
        {expired && (
          <div role="alert" className={styles.summaryProblem}>
            <p>Your price quote has expired. Refresh the prices to continue.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshQuote}
            >
              Refresh prices
            </Button>
          </div>
        )}

        <Button
          type="button"
          className={styles.placeOrder}
          onClick={onPlace}
          disabled={!canPlace}
          aria-busy={placing}
        >
          {placing ? "Placing your order…" : "Place your order"}
        </Button>
        <p className={styles.summaryNote}>
          You pay in cash when your order is delivered.
        </p>
      </div>
      <Link
        href={routes.bag}
        className={cn(buttonVariants({ variant: "outline" }), styles.backLink)}
      >
        <ChevronLeftIcon aria-hidden="true" />
        Back
      </Link>
    </aside>
  )
}
