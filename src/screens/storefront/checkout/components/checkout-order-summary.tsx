import Link from "next/link"
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { routes } from "@/config/routes"
import type { StorefrontCurrency } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

import { getCheckoutReviewTotals } from "../checkout-totals"
import styles from "../checkout.module.css"

type CheckoutOrderSummaryProps = {
  itemsTotal: number
  currency: StorefrontCurrency
  hasItems: boolean
  isReviewed: boolean
  onPlaceOrder: () => void
}

export function CheckoutOrderSummary({ itemsTotal, currency, hasItems, isReviewed, onPlaceOrder }: CheckoutOrderSummaryProps) {
  const totals = getCheckoutReviewTotals(itemsTotal, hasItems)
  return (
    <aside className={styles.summaryAside} aria-labelledby="order-summary-heading">
      <div className={styles.summaryPanel}>
        <h2 id="order-summary-heading">Order Summary</h2>
        <dl className={styles.summaryRows}>
          <div><dt>Items:</dt><dd>{formatStorefrontPrice(totals.items, currency)}</dd></div>
          <div><dt>Shipping:</dt><dd>{formatStorefrontPrice(totals.shipping, currency)}</dd></div>
          <div><dt>Estimated GST:</dt><dd>{formatStorefrontPrice(totals.gst, currency)}</dd></div>
          <div><dt>Gift Card:</dt><dd>{formatStorefrontPrice(totals.giftCard, currency)}</dd></div>
        </dl>
        <Separator className={styles.summaryDivider} />
        <dl className={styles.orderTotal}>
          <div>
            <dt>Order Total:</dt>
            <dd aria-live="polite" aria-atomic="true">{formatStorefrontPrice(totals.total, currency)}</dd>
          </div>
        </dl>
        <Separator className={styles.totalDivider} />
        <Button type="button" className={styles.placeOrder} onClick={onPlaceOrder} disabled={!hasItems || isReviewed}>
          {isReviewed ? "Demo checkout complete" : "Place your order"}
        </Button>
        {isReviewed && (
          <Alert className={styles.confirmation} role="status">
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>Demo checkout complete</AlertTitle>
            <AlertDescription>No order was sent and no payment was taken.</AlertDescription>
          </Alert>
        )}
      </div>
      <Link href={routes.bag} className={cn(buttonVariants({ variant: "outline" }), styles.backLink)}>
        <ChevronLeftIcon aria-hidden="true" />
        Back
      </Link>
    </aside>
  )
}
