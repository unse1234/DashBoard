import { apiClient } from "@/lib/api/axios"
import type {
  BagAction,
  BagDraftLine,
  BagQuote,
} from "@/types/storefront/bag.types"

/**
 * Validates and prices a bag, applying one action to it first if there is one.
 * The server does the merging, the counting and the arithmetic; nothing is
 * stored or reserved. An action that would put something unbuyable in the bag
 * is refused with a 409 (`PRODUCT_UNAVAILABLE` or `INSUFFICIENT_STOCK`, with
 * the `productId`) and changes nothing.
 *
 * Public: `skipAuth` keeps a staff token off the request.
 */
export async function quoteBag(
  request: { items: BagDraftLine[]; action?: BagAction },
  signal?: AbortSignal
): Promise<BagQuote> {
  const { data } = await apiClient.post<BagQuote>(
    "/storefront/bag/quote",
    request,
    { signal, skipAuth: true }
  )
  return data
}
