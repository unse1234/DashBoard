"use client"

import Link from "next/link"
import { CheckCircle2Icon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { DELIVERY_COUNTRY_NAME } from "@/constants/storefront.constants"
import { routes } from "@/config/routes"
import { useOrderConfirmation } from "@/hooks/storefront/use-order-confirmation"
import { cn } from "@/utils/cn"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

import styles from "./confirmation.module.css"

/**
 * The receipt of the order this tab just placed: its reference, what was
 * ordered at what price, where it is going, and that it is paid for in cash
 * when it arrives. It is kept for the tab's session only, so a reload shows it
 * again and a new tab does not.
 */
export function ConfirmationScreen() {
  const confirmation = useOrderConfirmation()

  if (!confirmation) {
    return (
      <section className={styles.page} aria-labelledby="confirmation-heading">
        <div className={styles.panel}>
          <h1 id="confirmation-heading" className={styles.heading}>
            No recent order
          </h1>
          <p className={styles.lead}>
            There is no order to show in this browser tab. If you placed one
            just now and the page was closed, it is still with the shop.
          </p>
          <Link
            href={routes.shop}
            className={cn(buttonVariants(), styles.action)}
          >
            Continue shopping
          </Link>
        </div>
      </section>
    )
  }

  const { receipt, delivery } = confirmation
  const money = (amount: number) =>
    formatStorefrontPrice(amount, receipt.currency)
  const { address } = delivery

  return (
    <section className={styles.page} aria-labelledby="confirmation-heading">
      <div className={styles.panel}>
        <CheckCircle2Icon aria-hidden="true" className={styles.tick} />
        <h1 id="confirmation-heading" className={styles.heading}>
          Order placed
        </h1>
        <p className={styles.lead}>
          Thank you, {delivery.contactName}. Your order reference is{" "}
          <strong>{receipt.id}</strong>. Please keep it.
        </p>
        <p className={styles.payment}>
          Cash on delivery: pay <strong>{money(receipt.total)}</strong> when
          your order arrives.
        </p>

        <h2 className={styles.subheading}>Delivering to</h2>
        <address className={styles.address}>
          <span>{address.recipientName}</span>
          <span>{address.addressLine1}</span>
          {address.addressLine2 && <span>{address.addressLine2}</span>}
          <span>
            {address.city}, {address.region}
            {address.postalCode && ` ${address.postalCode}`}
          </span>
          <span>{DELIVERY_COUNTRY_NAME}</span>
          <span>{delivery.phone}</span>
        </address>

        <h2 className={styles.subheading}>Your items</h2>
        <ul className={styles.items}>
          {receipt.items.map((item) => (
            <li key={item.productId}>
              <span>
                {item.productName}{" "}
                <span className={styles.quantity}>
                  × {item.quantity} at {money(item.unitPrice)}
                </span>
              </span>
              <span className={styles.amount}>{money(item.total)}</span>
            </li>
          ))}
        </ul>

        <dl className={styles.totals}>
          <div>
            <dt>Items</dt>
            <dd>{money(receipt.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{money(receipt.shipping)}</dd>
          </div>
          <div>
            <dt>Tax</dt>
            <dd>{money(receipt.tax)}</dd>
          </div>
          <div>
            <dt>Discount</dt>
            <dd>{money(receipt.discount)}</dd>
          </div>
          <div className={styles.grandTotal}>
            <dt>Total to pay on delivery</dt>
            <dd>{money(receipt.total)}</dd>
          </div>
        </dl>

        <Link
          href={routes.shop}
          className={cn(buttonVariants(), styles.action)}
        >
          Continue shopping
        </Link>
      </div>
    </section>
  )
}
