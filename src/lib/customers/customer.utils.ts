import type { CustomerAddress } from "@/lib/customers/customer.types"

/**
 * The lines of an address below the recipient: the street, the city line and
 * the country. Lines that are not set are left out.
 */
export function getAddressLines({
  addressLine1,
  addressLine2,
  city,
  region,
  postalCode,
  country,
}: Pick<
  CustomerAddress,
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "region"
  | "postalCode"
  | "country"
>) {
  const place = [city, region].filter(Boolean).join(", ")
  const cityLine = [place, postalCode].filter(Boolean).join(" ")

  return [addressLine1, addressLine2, cityLine, country].filter(
    (line): line is string => Boolean(line)
  )
}
