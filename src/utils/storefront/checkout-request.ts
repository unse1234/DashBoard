import { DELIVERY_COUNTRY_CODE } from "@/constants/storefront.constants"
import type { BagDraftLine, BagLine } from "@/types/storefront/bag.types"
import type {
  CheckoutAddress,
  ShippingAddressRequest,
} from "@/types/storefront/checkout.types"

/**
 * The form's address as the API takes it: whitespace trimmed, blank optional
 * fields left out, the country the shop delivers to. No judgement is made here;
 * the server validates.
 */
export function toShippingAddressRequest(
  address: CheckoutAddress
): ShippingAddressRequest {
  const addressLine2 = address.addressLine2.trim()
  const postalCode = address.postalCode.trim()

  return {
    recipientName: address.recipientName.trim(),
    addressLine1: address.addressLine1.trim(),
    ...(addressLine2 ? { addressLine2 } : {}),
    city: address.city.trim(),
    region: address.region.trim(),
    ...(postalCode ? { postalCode } : {}),
    country: DELIVERY_COUNTRY_CODE,
  }
}

/** The lines of a priced bag as the API takes them: ids and quantities only. */
export function toDraftLines(lines: readonly BagLine[]): BagDraftLine[] {
  return lines.map(({ productId, quantity }) => ({ productId, quantity }))
}
