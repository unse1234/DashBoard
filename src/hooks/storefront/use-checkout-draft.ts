"use client"

import { useContext } from "react"

import { CheckoutDraftContext } from "@/providers/checkout-draft-provider"

/** The contact and delivery details typed for this order. */
export function useCheckoutDraft() {
  const checkout = useContext(CheckoutDraftContext)
  if (!checkout) {
    throw new Error(
      "useCheckoutDraft must be used within a CheckoutDraftProvider"
    )
  }
  return checkout
}
