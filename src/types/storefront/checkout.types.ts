import type { BagDraftLine, BagLine } from "@/types/storefront/bag.types"
import type { StorefrontCurrency } from "@/types/storefront/product.types"

/** Who is buying, as the order will record them. */
export type CheckoutContact = {
  name: string
  email: string
  /** A Pakistani number the courier can call, as the shopper typed it. */
  phone: string
}

/** Where the order goes, as the form holds it. Blank optional fields are "". */
export type CheckoutAddress = {
  recipientName: string
  addressLine1: string
  addressLine2: string
  city: string
  /** The province or territory. */
  region: string
  postalCode: string
}

/** What the shopper has entered so far; nothing here is ever a price. */
export type CheckoutDraft = {
  contact: CheckoutContact | null
  shippingAddress: CheckoutAddress | null
}

export type CheckoutDetails = {
  contact: CheckoutContact
  shippingAddress: CheckoutAddress
}

export type CheckoutDraftContextValue = {
  draft: CheckoutDraft
  setDetails: (details: CheckoutDetails) => void
  clear: () => void
}

/** The address as the API takes it: blank optional fields left out. */
export type ShippingAddressRequest = {
  recipientName: string
  addressLine1: string
  addressLine2?: string
  city: string
  region: string
  postalCode?: string
  /** "PK". */
  country: string
}

export type CheckoutQuoteRequest = {
  items: BagDraftLine[]
  shippingAddress: ShippingAddressRequest
}

/** The server's price for a bag going to an address, signed. */
export type CheckoutQuote = {
  currency: StorefrontCurrency
  paymentMethod: "COD"
  items: BagLine[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  /** Opaque: stored and echoed back with the order, never read or made here. */
  quoteToken: string
  /** ISO 8601. After this the quote must be renewed. */
  expiresAt: string
}

export type PlaceOrderRequest = {
  contact: CheckoutContact
  items: BagDraftLine[]
  shippingAddress: ShippingAddressRequest
  quoteToken: string
}

/** What the guest is told about the order that was placed. */
export type OrderReceipt = {
  /** The order reference, "ORD-10001". A reference to show, not a credential. */
  id: string
  createdAt: string
  status: string
  paymentStatus: string
  paymentMethod: "COD" | null
  currency: StorefrontCurrency
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

/**
 * An order on its way: frozen when it was submitted, so that a retry is the
 * very same request. The key is what makes the retry safe.
 */
export type OrderAttempt = {
  /** The `Idempotency-Key`. */
  key: string
  request: PlaceOrderRequest
}

/** The receipt, with where the order is going, for the confirmation page. */
export type OrderConfirmation = {
  receipt: OrderReceipt
  delivery: {
    contactName: string
    email: string
    phone: string
    address: ShippingAddressRequest
  }
}
