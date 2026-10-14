import Link from "next/link"
import { BanknoteIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/config/routes"
import { cn } from "@/utils/cn"

import styles from "../checkout.module.css"

/** How the order is paid: the shop takes cash on delivery and nothing else. */
export function CheckoutPaymentPanel() {
  return (
    <section
      className={styles.paymentPanel}
      aria-labelledby="payment-review-heading"
    >
      <h2 id="payment-review-heading" className={styles.heading}>
        Payment method
      </h2>
      <div className={styles.detailsRow}>
        <div className={styles.paymentDetails}>
          <p>
            <BanknoteIcon aria-hidden="true" />
            <span>Cash on delivery</span>
          </p>
          <p className={styles.muted}>
            You pay in cash when your order arrives. Nothing is charged now.
          </p>
        </div>
        <Link
          href={routes.checkoutPayment}
          className={cn(
            buttonVariants({ variant: "outline" }),
            styles.changeLink
          )}
          aria-label="Change payment method"
        >
          Change
        </Link>
      </div>
    </section>
  )
}
