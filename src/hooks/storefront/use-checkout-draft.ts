"use client"

import { useContext } from "react"

import { CheckoutDraftContext } from "@/providers/checkout-draft-provider"

/** Address and display-only demo payment selection for the future checkout review. */
export function useCheckoutDraft() {
  const checkout = useContext(CheckoutDraftContext)
  if (!checkout) throw new Error("useCheckoutDraft must be used within a CheckoutDraftProvider")
  return checkout
}
