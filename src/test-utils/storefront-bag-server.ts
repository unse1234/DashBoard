import type { MockReply, RecordedRequest } from "@/test-utils/mock-api"
import type {
  BagAction,
  BagDraftLine,
  BagLine,
  BagQuote,
} from "@/types/storefront/bag.types"
import type { StorefrontProduct } from "@/types/storefront/product.types"

const MAX_QUANTITY = 1000
const MAX_LINES = 100

/** The API's refusal, in the shape its error filter sends. */
function refusal(status: number, code: string, message: string, extra = {}) {
  return { status, data: { statusCode: status, message, code, ...extra } }
}

type BagRequest = { items: BagDraftLine[]; action?: BagAction }

/**
 * A stand-in for `POST /storefront/bag/quote`, for tests. It follows the real
 * server's rules (merging, the actions, stock, the exact-cents arithmetic and
 * the shape of what it sends), so a screen under test is shown what it would
 * be shown by the API, and a test can check what the screen sent.
 *
 * Every product in `products` is for sale. Stock defaults to plenty, or to
 * nothing for a product that is not `inStock`; `stock` overrides it per id.
 * Everything else is unknown to the server, as a product that is switched off
 * would be.
 */
export function createBagServer(
  products: StorefrontProduct[],
  stock: Record<string, number> = {}
) {
  const catalog = new Map(products.map((product) => [product.id, product]))
  const stockOf = (id: string) =>
    stock[id] ?? (catalog.get(id)?.inStock === false ? 0 : 100)

  const issueFor = (productId: string, quantity: number) => {
    if (!catalog.has(productId)) return "PRODUCT_UNAVAILABLE" as const
    return quantity > stockOf(productId)
      ? ("INSUFFICIENT_STOCK" as const)
      : null
  }

  function price(items: BagDraftLine[]): BagQuote {
    let cents = 0
    const lines: BagLine[] = items.map(({ productId, quantity }) => {
      const product = catalog.get(productId)
      if (!product) {
        return {
          productId,
          quantity,
          product: null,
          unitPrice: null,
          lineTotal: null,
          issue: "PRODUCT_UNAVAILABLE",
        }
      }
      const lineCents = Math.round(product.price * 100) * quantity
      cents += lineCents
      return {
        productId,
        quantity,
        product,
        unitPrice: product.price,
        lineTotal: lineCents / 100,
        issue: issueFor(productId, quantity),
      }
    })
    return {
      currency: "PKR",
      items: lines,
      subtotal: cents / 100,
      lineCount: lines.length,
      unitCount: lines.reduce((units, line) => units + line.quantity, 0),
      hasIssues: lines.some((line) => line.issue !== null),
    }
  }

  function apply(items: BagDraftLine[], action: BagAction) {
    const index = items.findIndex((line) => line.productId === action.productId)
    const current = index === -1 ? 0 : items[index].quantity
    const without = items.filter((_, i) => i !== index)

    switch (action.type) {
      case "remove":
        return { items: without, raised: null }
      case "decrement":
        if (index === -1) return { items, raised: null }
        return current - 1 < 1
          ? { items: without, raised: null }
          : {
              items: items.map((line, i) =>
                i === index ? { ...line, quantity: current - 1 } : line
              ),
              raised: null,
            }
      default: {
        const next =
          action.type === "set"
            ? (action.quantity ?? 0)
            : current + (action.type === "add" ? (action.quantity ?? 1) : 1)
        const raised = { productId: action.productId, quantity: next }
        return {
          items:
            index === -1
              ? [...items, raised]
              : items.map((line, i) => (i === index ? raised : line)),
          raised,
        }
      }
    }
  }

  /** The reply for a quote request; anything else is a 404. */
  function handle(request: RecordedRequest): MockReply {
    if (request.method !== "POST" || request.url !== "/storefront/bag/quote") {
      return refusal(404, "NOT_FOUND", "Not found")
    }
    const { items, action } = request.body as BagRequest

    if (items.length > MAX_LINES) {
      return refusal(400, "INVALID_BAG", "A bag can hold at most 100 products")
    }
    const seen = new Set<string>()
    for (const line of items) {
      if (seen.has(line.productId.toUpperCase())) {
        return refusal(
          400,
          "INVALID_BAG",
          "Each product can appear only once in a bag"
        )
      }
      seen.add(line.productId.toUpperCase())
    }

    let bag = items
    if (action) {
      const applied = apply(items, action)
      if (applied.raised) {
        if (
          applied.raised.quantity < 1 ||
          applied.raised.quantity > MAX_QUANTITY
        ) {
          return refusal(
            400,
            "INVALID_BAG",
            `Quantity must be between 1 and ${MAX_QUANTITY}`
          )
        }
        const issue = issueFor(
          applied.raised.productId,
          applied.raised.quantity
        )
        if (issue) {
          return refusal(
            409,
            issue,
            issue === "PRODUCT_UNAVAILABLE"
              ? "This product is no longer available"
              : "There is not enough stock for this quantity",
            { productId: applied.raised.productId }
          )
        }
      }
      bag = applied.items
    }
    return { data: price(bag) }
  }

  return { handle, price }
}
