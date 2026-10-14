import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { DELIVERY_COUNTRY_NAME } from "@/constants/storefront.constants"
import { routes } from "@/config/routes"
import type { CheckoutDraft } from "@/types/storefront/checkout.types"
import { cn } from "@/utils/cn"

import styles from "../checkout.module.css"

type CheckoutDetailsPanelProps = {
  draft: CheckoutDraft
}

/** Who the order is for and where it goes, with the way to change them. */
export function CheckoutDetailsPanel({ draft }: CheckoutDetailsPanelProps) {
  const { contact, shippingAddress: address } = draft
  const changeLinkClass = cn(
    buttonVariants({ variant: "outline" }),
    styles.changeLink
  )

  return (
    <section
      className={styles.shippingPanel}
      aria-labelledby="shipping-review-heading"
    >
      <h2 id="shipping-review-heading" className={styles.heading}>
        Shipping address
      </h2>

      {contact && address ? (
        <div className={styles.detailsRow}>
          <div className={styles.detailsText}>
            <address className={styles.address}>
              <span>{address.recipientName}</span>
              <span>{address.addressLine1}</span>
              {address.addressLine2 && <span>{address.addressLine2}</span>}
              <span>
                {address.city}, {address.region}
                {address.postalCode && ` ${address.postalCode}`}
              </span>
              <span>{DELIVERY_COUNTRY_NAME}</span>
            </address>
            <dl className={styles.contact}>
              <div>
                <dt>Contact</dt>
                <dd>{contact.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{contact.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{contact.phone}</dd>
              </div>
            </dl>
          </div>
          <Link
            href={routes.checkoutAddress}
            className={changeLinkClass}
            aria-label="Change shipping address"
          >
            Change
          </Link>
        </div>
      ) : (
        <div className={styles.detailsRow}>
          <p className={styles.address}>
            Add where we should deliver your order and how to reach you.
          </p>
          <Link
            href={routes.checkoutAddress}
            className={cn(buttonVariants(), styles.addLink)}
          >
            Add details
          </Link>
        </div>
      )}
    </section>
  )
}
