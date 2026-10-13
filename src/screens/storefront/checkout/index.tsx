"use client"

import { useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { routes } from "@/config/routes"
import { useBag } from "@/hooks/storefront/use-bag"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { demoCheckoutAddress } from "@/mocks/storefront/checkout-address-demo"
import { demoCheckoutPaymentMethods } from "@/mocks/storefront/checkout-payment-demo"
import { demoCheckoutReviewPricing } from "@/mocks/storefront/checkout-review-demo"
import { DemoCardIcon } from "@/screens/storefront/payment-method/components/payment-icons"
import type { BagItem } from "@/types/storefront/bag.types"
import { cn } from "@/utils/cn"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

import { CheckoutGiftIcon } from "./components/checkout-gift-icon"
import { CheckoutOrderSummary } from "./components/checkout-order-summary"
import { CheckoutReviewBag } from "./components/checkout-review-bag"
import styles from "./checkout.module.css"

export function CheckoutScreen() {
  const { items, total } = useBag()
  const { draft, setShippingAddress, setPaymentMethod } = useCheckoutDraft()
  const address = draft.shippingAddress ?? demoCheckoutAddress
  const payment = draft.paymentMethod ?? demoCheckoutPaymentMethods[0]
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [reviewedItems, setReviewedItems] = useState<BagItem[] | null>(null)
  const isReviewed = reviewedItems === items
  const changeLinkClass = cn(buttonVariants({ variant: "outline" }), styles.changeLink)

  function placeDemoOrder() {
    if (items.length === 0) return
    setShippingAddress(address)
    setPaymentMethod(payment)
    setReviewedItems(items)
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-heading">
      <h1 id="checkout-heading" className="sr-only">Checkout</h1>
      <div className={styles.content}>
        <div className={styles.sections}>
          <section className={styles.shippingPanel} aria-labelledby="shipping-review-heading">
            <h2 id="shipping-review-heading" className={styles.heading}>Shipping address</h2>
            <div className={styles.detailsRow}>
              <address className={styles.address}>
                <span>{address.shippingName}</span>
                <span>{address.streetName}</span>
                <span>{address.city}, {address.stateProvince}</span>
                <span>{address.country}</span>
              </address>
              <Link href={routes.checkoutAddress} className={changeLinkClass} aria-label="Change shipping address" onClick={() => setShippingAddress(address)}>
                Change
              </Link>
            </div>
          </section>

          <section className={styles.paymentPanel} aria-labelledby="payment-review-heading">
            <h2 id="payment-review-heading" className={styles.heading}>Payment method</h2>
            <div className={styles.detailsRow}>
              <div className={styles.paymentDetails}>
                <p><DemoCardIcon /><span>{payment.brand} <span className={styles.muted}>ending in {payment.last4}</span></span></p>
                <p><CheckoutGiftIcon /><span>{formatStorefrontPrice(demoCheckoutReviewPricing.giftCardBalance)} <span className={styles.muted}>gift card balance</span></span></p>
              </div>
              <Link href={routes.checkoutPayment} className={changeLinkClass} aria-label="Change payment method" onClick={() => setPaymentMethod(payment)}>
                Change
              </Link>
            </div>
            <Field orientation="horizontal" className={styles.billingPreference}>
              <Checkbox id="billing-same-as-shipping" checked={billingSameAsShipping} onCheckedChange={(checked) => {
                setBillingSameAsShipping(checked)
                setReviewedItems(null)
              }} />
              <FieldLabel htmlFor="billing-same-as-shipping">Billing address same as Shipping Address</FieldLabel>
            </Field>
          </section>
          <CheckoutReviewBag items={items} />
        </div>
        <CheckoutOrderSummary itemsTotal={total} hasItems={items.length > 0} isReviewed={isReviewed} onPlaceOrder={placeDemoOrder} />
      </div>
    </section>
  )
}
