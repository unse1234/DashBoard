export type CheckoutShippingAddress = {
  shippingName: string
  streetName: string
  city: string
  stateProvince: string
  country: string
  /** A preference for this in-memory demo only. */
  isDefault: boolean
}

export type DemoCardBrand = "MasterCard" | "VISA" | "American Express"

/** Display information only. Never add a full card number or CVC here. */
export type MockPaymentMethodSummary = {
  id: string
  brand: DemoCardBrand
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  isDemo: true
}

export type CheckoutDraft = {
  shippingAddress: CheckoutShippingAddress | null
  paymentMethod: MockPaymentMethodSummary | null
}

export type CheckoutDraftContextValue = {
  draft: CheckoutDraft
  setShippingAddress: (address: CheckoutShippingAddress) => void
  setPaymentMethod: (method: MockPaymentMethodSummary) => void
}
