"use client"

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type {
  CheckoutDetails,
  CheckoutDraft,
  CheckoutDraftContextValue,
} from "@/types/storefront/checkout.types"

export const CheckoutDraftContext =
  createContext<CheckoutDraftContextValue | null>(null)

const EMPTY_DRAFT: CheckoutDraft = { contact: null, shippingAddress: null }

/**
 * What the shopper has typed for this order: who they are and where it goes.
 * It lives only while the checkout layout is mounted, holds no price (those
 * come from the server's quote) and has no payment field (the only way to pay
 * is cash on delivery).
 */
export function CheckoutDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckoutDraft>(EMPTY_DRAFT)

  const setDetails = useCallback((details: CheckoutDetails) => {
    // Copied field by field, so nothing a caller attached rides along.
    setDraft({
      contact: {
        name: details.contact.name,
        email: details.contact.email,
        phone: details.contact.phone,
      },
      shippingAddress: {
        recipientName: details.shippingAddress.recipientName,
        addressLine1: details.shippingAddress.addressLine1,
        addressLine2: details.shippingAddress.addressLine2,
        city: details.shippingAddress.city,
        region: details.shippingAddress.region,
        postalCode: details.shippingAddress.postalCode,
      },
    })
  }, [])

  const clear = useCallback(() => setDraft(EMPTY_DRAFT), [])

  const value = useMemo(
    () => ({ draft, setDetails, clear }),
    [draft, setDetails, clear]
  )

  return (
    <CheckoutDraftContext.Provider value={value}>
      {children}
    </CheckoutDraftContext.Provider>
  )
}
