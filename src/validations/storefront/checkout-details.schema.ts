import { z } from "zod"

import { CHECKOUT_LIMITS } from "@/constants/storefront.constants"

// Feedback while typing, not a gatekeeper: the API validates the same fields
// again and its answer is final. These bounds are the API's own, so a value
// that passes here is one it can record.

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `Use ${max} characters or fewer.`)

const optional = (max: number) =>
  z.string().trim().max(max, `Use ${max} characters or fewer.`)

// Digits with the separators people write ("0300 1234567", "+92 300 1234567",
// "(042) 3576-1234"): enough to catch a typo, without ruling on which numbers
// exist.
const PHONE_CHARACTERS = /^\+?[\d\s\-().]+$/
const MIN_PHONE_DIGITS = 9
// "0092" and a ten-digit number.
const MAX_PHONE_DIGITS = 14

export const checkoutDetailsSchema = z.object({
  name: required("your name", CHECKOUT_LIMITS.name),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(
      CHECKOUT_LIMITS.email,
      `Use ${CHECKOUT_LIMITS.email} characters or fewer.`
    )
    // An empty value has its own message above.
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid email address."
    ),
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number we can reach you on.")
    .max(
      CHECKOUT_LIMITS.phone,
      `Use ${CHECKOUT_LIMITS.phone} characters or fewer.`
    )
    .refine((value) => {
      if (value === "") return true // has its own message above
      if (!PHONE_CHARACTERS.test(value)) return false
      const digits = value.replace(/\D/g, "").length
      return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS
    }, "Enter a Pakistani phone number, such as 0300 1234567 or +92 300 1234567."),
  // Left blank, the order goes to the buyer's own name.
  recipientName: optional(CHECKOUT_LIMITS.name),
  addressLine1: required("a street address", CHECKOUT_LIMITS.addressLine),
  addressLine2: optional(CHECKOUT_LIMITS.addressLine),
  city: required("a city", CHECKOUT_LIMITS.city),
  region: required("a province", CHECKOUT_LIMITS.region),
  postalCode: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{5}$/.test(value),
      "Use five digits."
    ),
})

export type CheckoutDetailsFormValues = z.infer<typeof checkoutDetailsSchema>
