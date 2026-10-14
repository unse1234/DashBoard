import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { routes } from "@/config/routes"
import type { OrderRefusal } from "@/utils/storefront/order-refusal"
import { cn } from "@/utils/cn"

import styles from "../checkout.module.css"

type UnconfirmedPanelProps = {
  /** True while the request is on its way again. */
  retrying: boolean
  onRetry: () => void
}

/**
 * Shown when the shop could not confirm whether the order was placed. The
 * shopper is told the truth (it may exist) and that trying again is safe, and
 * there is nothing else to do: no new order can start until this one is known.
 */
export function UnconfirmedPanel({ retrying, onRetry }: UnconfirmedPanelProps) {
  return (
    <section
      role="alert"
      className={styles.alertPanel}
      aria-labelledby="unconfirmed-heading"
    >
      <h2 id="unconfirmed-heading" className={styles.alertHeading}>
        We couldn’t confirm your order
      </h2>
      <p>
        Your order may or may not have been placed: the connection was lost
        before we heard back. Please try again. It is safe to do so, because
        retrying will never place a second order.
      </p>
      <div className={styles.alertActions}>
        <Button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={styles.alertButton}
        >
          {retrying ? "Trying again…" : "Try again"}
        </Button>
      </div>
    </section>
  )
}

type RefusedPanelProps = {
  refusal: OrderRefusal
  onDismiss: () => void
}

/** Shown when the API refused the order: nothing was placed, and what to fix. */
export function RefusedPanel({ refusal, onDismiss }: RefusedPanelProps) {
  return (
    <section
      role="alert"
      className={styles.alertPanel}
      aria-labelledby="refused-heading"
    >
      <h2 id="refused-heading" className={styles.alertHeading}>
        Your order was not placed
      </h2>
      <p>{refusal.message}</p>
      <div className={styles.alertActions}>
        {refusal.remedy === "bag" && (
          <Link
            href={routes.bag}
            className={cn(buttonVariants(), styles.alertButton)}
          >
            Review your bag
          </Link>
        )}
        {refusal.remedy === "details" && (
          <Link
            href={routes.checkoutAddress}
            className={cn(buttonVariants(), styles.alertButton)}
          >
            Edit your details
          </Link>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onDismiss}
          className={styles.alertButton}
        >
          Dismiss
        </Button>
      </div>
    </section>
  )
}
