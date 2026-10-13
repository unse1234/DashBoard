"use client"

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react"

import type {
  CheckoutDraft,
  CheckoutDraftContextValue,
  CheckoutShippingAddress,
  MockPaymentMethodSummary,
} from "@/types/storefront/checkout-draft.types"

export const CheckoutDraftContext = createContext<CheckoutDraftContextValue | null>(null)

/** Lives only while the checkout layout is mounted; no storage, auth, or bag dependency. */
export function CheckoutDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckoutDraft>({
    shippingAddress: null,
    paymentMethod: null,
  })

  const setShippingAddress = useCallback((address: CheckoutShippingAddress) => {
    setDraft((current) => ({
      ...current,
      shippingAddress: {
        shippingName: address.shippingName,
        streetName: address.streetName,
        city: address.city,
        stateProvince: address.stateProvince,
        country: address.country,
        isDefault: address.isDefault,
      },
    }))
  }, [])

  const setPaymentMethod = useCallback((method: MockPaymentMethodSummary) => {
    // Explicitly copy the allowlisted display fields, even if a caller has extras.
    setDraft((current) => ({
      ...current,
      paymentMethod: {
        id: method.id,
        brand: method.brand,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault,
        isDemo: true,
      },
    }))
  }, [])

  const value = useMemo(
    () => ({ draft, setShippingAddress, setPaymentMethod }),
    [draft, setShippingAddress, setPaymentMethod]
  )

  return <CheckoutDraftContext.Provider value={value}>{children}</CheckoutDraftContext.Provider>
}
