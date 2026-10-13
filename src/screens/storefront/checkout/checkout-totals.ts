import { demoCheckoutReviewPricing } from "@/mocks/storefront/checkout-review-demo"

/** Round each demo charge in cents and include shipping in the final total. */
export function getCheckoutReviewTotals(itemsTotal: number, hasItems: boolean) {
  const itemsCents = Math.round(itemsTotal * 100)
  const shippingCents = hasItems ? Math.round(demoCheckoutReviewPricing.shipping * 100) : 0
  const gstCents = Math.round(itemsCents * demoCheckoutReviewPricing.gstRate)
  const giftCardCents = Math.round(demoCheckoutReviewPricing.giftCardApplied * 100)
  return {
    items: itemsCents / 100,
    shipping: shippingCents / 100,
    gst: gstCents / 100,
    giftCard: giftCardCents / 100,
    total: (itemsCents + shippingCents + gstCents - giftCardCents) / 100,
  }
}
