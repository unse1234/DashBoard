import type { OrderAddress } from "@/types/order.types"

/**
 * The lines of an address below the recipient: the street, the city line and
 * the country. Lines that are not set are left out.
 */
export function getOrderAddressLines({
  addressLine1,
  addressLine2,
  city,
  region,
  postalCode,
  country,
}: Omit<OrderAddress, "recipientName" | "phone">) {
  const place = [city, region].filter(Boolean).join(", ")
  const cityLine = [place, postalCode].filter(Boolean).join(" ")

  return [addressLine1, addressLine2, cityLine, country].filter(
    (line): line is string => Boolean(line)
  )
}
