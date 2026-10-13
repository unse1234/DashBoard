import { z } from "zod"

import type { DemoCardBrand } from "@/types/storefront/checkout-draft.types"

export function getDemoCardBrand(digits: string): DemoCardBrand | null {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(digits)) return "VISA"
  if (/^3[47]\d{13}$/.test(digits)) return "American Express"
  if (digits.length === 16) {
    const prefix = Number(digits.slice(0, 4))
    if (/^5[1-5]/.test(digits) || (prefix >= 2221 && prefix <= 2720)) return "MasterCard"
  }
  return null
}

function passesCardChecksum(digits: string) {
  let sum = 0
  let double = false
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

export function formatDemoCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19)
  if (/^3[47]/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ")
  }
  return digits.match(/.{1,4}/g)?.join(" ") ?? ""
}

export function formatDemoCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6)
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
}

export function parseDemoCardExpiry(value: string) {
  const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(value.trim())
  if (!match) return null
  return {
    expiryMonth: Number(match[1]),
    expiryYear: Number(match[2]) + (match[2].length === 2 ? 2000 : 0),
  }
}

/** Structural demo validation only; no processor or card verification request. */
export const checkoutPaymentSchema = z.object({
  cardholderName: z.string().trim().min(1, "Enter the cardholder name.").max(120, "Use 120 characters or fewer."),
  cardNumber: z.string().min(1, "Enter a card number.").refine((value) => {
    if (!/^[\d -]+$/.test(value)) return false
    const digits = value.replace(/[ -]/g, "")
    return getDemoCardBrand(digits) !== null && passesCardChecksum(digits)
  }, "Enter a valid Visa, MasterCard, or American Express number."),
  expiry: z.string().min(1, "Enter an expiry date.").refine((value) => {
    const expiry = parseDemoCardExpiry(value)
    if (!expiry || expiry.expiryMonth < 1 || expiry.expiryMonth > 12) return false
    const now = new Date()
    return expiry.expiryYear > now.getFullYear() ||
      (expiry.expiryYear === now.getFullYear() && expiry.expiryMonth >= now.getMonth() + 1)
  }, "Enter a current or future date as MM / YYYY."),
  cvc: z.string().regex(/^\d{3,4}$/, "Enter a 3 or 4 digit CVC."),
  isDefault: z.boolean(),
}).superRefine((values, context) => {
  const brand = getDemoCardBrand(values.cardNumber.replace(/\D/g, ""))
  if (brand && values.cvc.length !== (brand === "American Express" ? 4 : 3)) {
    context.addIssue({ code: "custom", path: ["cvc"], message: brand === "American Express" ? "Enter the 4 digit CVC." : "Enter the 3 digit CVC." })
  }
})

/** Transient form values only; never pass these to the checkout provider. */
export type CheckoutPaymentFormValues = z.infer<typeof checkoutPaymentSchema>
