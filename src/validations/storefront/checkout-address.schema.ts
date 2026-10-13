import { z } from "zod"

const requiredAddressValue = (label: string) =>
  z.string().trim().min(1, `Enter ${label}.`).max(120, "Use 120 characters or fewer.")

export const checkoutAddressSchema = z.object({
  shippingName: requiredAddressValue("a shipping name"),
  streetName: requiredAddressValue("a street name"),
  city: requiredAddressValue("a city"),
  stateProvince: requiredAddressValue("a state or province"),
  country: requiredAddressValue("a country"),
  isDefault: z.boolean(),
})
