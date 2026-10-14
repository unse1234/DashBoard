import { useQuery } from "@tanstack/react-query"

import { checkoutKeys } from "@/hooks/storefront/checkout.keys"
import { quoteCheckout } from "@/services/storefront/checkout.api"
import type { CheckoutQuoteRequest } from "@/types/storefront/checkout.types"

/**
 * The server's price for the bag going to the address; idle while there is not
 * yet a request to price. A quote is a read (it creates and reserves nothing),
 * so it is a query.
 *
 * Two properties matter more than speed. The key holds the lines and the
 * address, and nothing is kept across a change of them (no placeholder data),
 * so an order can never be placed from the quote of another bag or address.
 * And a cached quote is always revalidated when the screen opens (`staleTime`
 * 0), because prices and stock move and quotes expire (`expiresAt`).
 *
 * A 4xx is the API's considered answer (a line that cannot be bought, an
 * address outside Pakistan) and is not retried.
 */
export function useCheckoutQuoteQuery(request: CheckoutQuoteRequest | null) {
  return useQuery({
    queryKey: checkoutKeys.quote(request),
    queryFn: ({ signal }) =>
      quoteCheckout(request as CheckoutQuoteRequest, signal),
    enabled: request !== null,
    staleTime: 0,
  })
}
