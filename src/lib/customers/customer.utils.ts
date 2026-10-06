import { CUSTOMER_STATUS_LABELS } from "@/lib/customers/customer.constants"
import type {
  CustomerAddress,
  CustomerStatus,
} from "@/lib/customers/customer.types"

export function getToggledStatus(status: CustomerStatus): CustomerStatus {
  return status === "active" ? "inactive" : "active"
}

export function getStatusChangeMessage(name: string, status: CustomerStatus) {
  return `${name} is now ${CUSTOMER_STATUS_LABELS[status].toLowerCase()}.`
}

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
