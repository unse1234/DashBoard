import type { MockReply, RecordedRequest } from "@/test-utils/mock-api"
import { createBagServer } from "@/test-utils/storefront-bag-server"
import type {
  CheckoutQuote,
  OrderReceipt,
  PlaceOrderRequest,
} from "@/types/storefront/checkout.types"
import type { StorefrontProduct } from "@/types/storefront/product.types"

const refusal = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {}
) => ({
  status,
  data: { statusCode: status, message, code, ...extra },
})

type StoredOrder = { hash: string; receipt: OrderReceipt }

/**
 * A stand-in for the storefront's bag, checkout-quote and order endpoints, for
 * tests. It keeps the real server's contract: quotes are priced from the
 * products and signed, an order is held to its quote to the cent, stock is taken
 * once, and a key replays its original order before anything else is looked at.
 *
 * `quoteLifetimeMs` sets how long a quote lasts; the clock is the real one, so a
 * test that needs an expired quote asks for one that already is (a negative
 * lifetime).
 */
export function createCheckoutServer(
  products: StorefrontProduct[],
  options: { stock?: Record<string, number>; quoteLifetimeMs?: number } = {}
) {
  const stock = { ...options.stock }
  const bag = createBagServer(products, stock)
  const catalog = new Map(products.map((product) => [product.id, product]))
  let lifetime = options.quoteLifetimeMs ?? 30 * 60 * 1000

  const orders = new Map<string, StoredOrder>()
  let sequence = 10000
  let tokenSequence = 0

  const stockOf = (id: string) =>
    stock[id] ?? (catalog.get(id)?.inStock === false ? 0 : 100)

  function priceItems(items: { productId: string; quantity: number }[]) {
    return bag.price(items)
  }

  const requests = {
    quotes: [] as RecordedRequest[],
    orders: [] as RecordedRequest[],
  }

  function quote(request: RecordedRequest): MockReply {
    requests.quotes.push(request)
    const { items, shippingAddress } = request.body as {
      items: { productId: string; quantity: number }[]
      shippingAddress: { region: string; country: string }
    }
    if (!/^(pk|pakistan)$/i.test(shippingAddress.country.trim())) {
      return refusal(
        400,
        "UNSUPPORTED_DESTINATION",
        "We only deliver within Pakistan"
      )
    }
    const priced = priceItems(items)
    const blocked = priced.items.filter((line) => line.issue !== null)
    if (blocked.length > 0) {
      return refusal(
        409,
        blocked.some((line) => line.issue === "PRODUCT_UNAVAILABLE")
          ? "PRODUCT_UNAVAILABLE"
          : "INSUFFICIENT_STOCK",
        "Some products in your bag cannot be bought as they are. Review your bag.",
        {
          issues: blocked.map((line) => ({
            productId: line.productId,
            issue: line.issue,
          })),
        }
      )
    }

    const claims = {
      items: [...items]
        .sort((a, b) => a.productId.localeCompare(b.productId))
        .map((line) => [line.productId, line.quantity]),
      prices: Object.fromEntries(
        priced.items.map((line) => [line.productId, line.unitPrice])
      ),
      region: shippingAddress.region.trim().toLowerCase(),
      total: priced.subtotal,
      // Two quotes in one moment are still two tokens, as a real expiry makes them.
      n: ++tokenSequence,
    }
    const expiresAt = new Date(Date.now() + lifetime)
    const body: CheckoutQuote = {
      currency: "PKR",
      paymentMethod: "COD",
      items: priced.items,
      subtotal: priced.subtotal,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: priced.subtotal,
      quoteToken: `${btoa(JSON.stringify(claims))}.${expiresAt.getTime()}`,
      expiresAt: expiresAt.toISOString(),
    }
    return { data: body }
  }

  function placeOrder(request: RecordedRequest): MockReply {
    requests.orders.push(request)
    const key = request.headers["idempotency-key"]
    if (!key)
      return refusal(400, "BAD_REQUEST", "Send an Idempotency-Key header")
    const body = request.body as PlaceOrderRequest
    const hash = JSON.stringify(body)

    // Before anything about the quote or the stock: the order is its own answer.
    const existing = orders.get(key)
    if (existing) {
      return existing.hash === hash
        ? { status: 201, data: existing.receipt }
        : refusal(
            409,
            "IDEMPOTENCY_CONFLICT",
            "This Idempotency-Key was already used for a different order"
          )
    }

    const [encoded, expires] = body.quoteToken.split(".")
    let claims: {
      items: [string, number][]
      prices: Record<string, number>
      region: string
    }
    try {
      claims = JSON.parse(atob(encoded)) as typeof claims
    } catch {
      return refusal(
        409,
        "QUOTE_CHANGED",
        "Your checkout could not be verified",
        {
          reason: "TOKEN_INVALID",
        }
      )
    }
    if (Number(expires) <= Date.now()) {
      return refusal(409, "QUOTE_CHANGED", "Your price quote has expired", {
        reason: "QUOTE_EXPIRED",
      })
    }

    const lines = body.items
    const sameItems =
      lines.length === claims.items.length &&
      [...lines]
        .sort((a, b) => a.productId.localeCompare(b.productId))
        .every(
          (line, index) =>
            claims.items[index][0] === line.productId &&
            claims.items[index][1] === line.quantity
        )
    if (!sameItems) {
      return refusal(409, "QUOTE_CHANGED", "Your order changed", {
        reason: "ITEMS_CHANGED",
      })
    }

    const priced = priceItems(lines)
    for (const line of priced.items) {
      if (line.issue === "PRODUCT_UNAVAILABLE") {
        return refusal(
          409,
          "PRODUCT_UNAVAILABLE",
          "A product in your bag is no longer available. Review your bag.",
          { productId: line.productId }
        )
      }
      if (line.issue === "INSUFFICIENT_STOCK") {
        return refusal(
          409,
          "INSUFFICIENT_STOCK",
          "There is not enough stock for this quantity. Review your bag.",
          { productId: line.productId }
        )
      }
    }
    // The price each line had when it was quoted must still be its price.
    if (
      priced.items.some(
        (line) => claims.prices[line.productId] !== line.unitPrice
      )
    ) {
      return refusal(409, "QUOTE_CHANGED", "Prices changed", {
        reason: "PRICES_CHANGED",
      })
    }

    for (const line of lines) {
      stock[line.productId] = stockOf(line.productId) - line.quantity
    }
    sequence += 1
    const receipt: OrderReceipt = {
      id: `ORD-${sequence}`,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "COD",
      currency: "PKR",
      items: priced.items.map((line) => ({
        productId: line.productId,
        productName: line.product?.name ?? "",
        quantity: line.quantity,
        unitPrice: line.unitPrice ?? 0,
        total: line.lineTotal ?? 0,
      })),
      subtotal: priced.subtotal,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: priced.subtotal,
    }
    orders.set(key, { hash, receipt })
    return { status: 201, data: receipt }
  }

  function handle(request: RecordedRequest): MockReply {
    if (request.url === "/storefront/checkout/quote") return quote(request)
    if (request.url === "/storefront/orders") return placeOrder(request)
    return bag.handle(request)
  }

  return {
    handle,
    /** Every order placed, by Idempotency-Key. */
    orders,
    requests,
    stockOf,
    /** Quotes issued from now on last this long; negative ones are already stale. */
    setQuoteLifetime(milliseconds: number) {
      lifetime = milliseconds
    },
    /** Sets a product's stock, as another shopper buying would. */
    setStock(productId: string, amount: number) {
      stock[productId] = amount
    },
  }
}
