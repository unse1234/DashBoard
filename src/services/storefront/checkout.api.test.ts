import { mockApi, networkError } from "@/test-utils/mock-api"
import { PLACE_ORDER_TIMEOUT_MS } from "@/constants/storefront.constants"
import { placeOrder, quoteCheckout } from "@/services/storefront/checkout.api"
import type {
  CheckoutQuote,
  OrderAttempt,
  OrderReceipt,
} from "@/types/storefront/checkout.types"

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

const request = {
  items: [{ productId: "PRD-1001", quantity: 2 }],
  shippingAddress: {
    recipientName: "Ayesha Khan",
    addressLine1: "House 12",
    city: "Lahore",
    region: "Punjab",
    country: "PK",
  },
}

describe("quoteCheckout", () => {
  it("posts the lines and the address to the public route and returns the quote as sent", async () => {
    const quote = { quoteToken: "t", total: 3000 } as CheckoutQuote
    api = mockApi(() => ({ data: quote }))

    await expect(quoteCheckout(request)).resolves.toEqual(quote)

    const [sent] = api.requests
    expect(sent.method).toBe("POST")
    expect(sent.url).toBe("/storefront/checkout/quote")
    expect(sent.body).toEqual(request)
    expect(sent.headers.authorization).toBeUndefined()
    expect(sent.withCredentials).toBe(false)
  })

  it("rejects with the refusal's code and the lines it names", async () => {
    api = mockApi(() => ({
      status: 409,
      data: {
        statusCode: 409,
        message: "Review your bag.",
        code: "INSUFFICIENT_STOCK",
        issues: [{ productId: "PRD-1001", issue: "INSUFFICIENT_STOCK" }],
      },
    }))

    await expect(quoteCheckout(request)).rejects.toMatchObject({
      status: 409,
      code: "INSUFFICIENT_STOCK",
      details: {
        issues: [{ productId: "PRD-1001", issue: "INSUFFICIENT_STOCK" }],
      },
    })
  })
})

describe("placeOrder", () => {
  const attempt: OrderAttempt = {
    key: "4f0c1a52-2c3e-4b1f-9d3e-0a1b2c3d4e5f",
    request: {
      contact: {
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "0300 1234567",
      },
      ...request,
      quoteToken: "quote.token",
    },
  }

  it("sends the attempt with its Idempotency-Key, to the public route, with a timeout", async () => {
    const receipt = { id: "ORD-10001" } as OrderReceipt
    api = mockApi(() => ({ status: 201, data: receipt }))

    await expect(placeOrder(attempt)).resolves.toEqual(receipt)

    const [sent] = api.requests
    expect(sent.method).toBe("POST")
    expect(sent.url).toBe("/storefront/orders")
    expect(sent.headers["idempotency-key"]).toBe(attempt.key)
    expect(sent.body).toEqual(attempt.request)
    expect(sent.headers.authorization).toBeUndefined()
  })

  it("sends the very same request and key when it is sent again", async () => {
    api = mockApi(() => ({ status: 201, data: { id: "ORD-10001" } }))

    await placeOrder(attempt)
    await placeOrder(attempt)

    expect(api.requests[1].body).toEqual(api.requests[0].body)
    expect(api.requests[1].headers["idempotency-key"]).toBe(
      api.requests[0].headers["idempotency-key"]
    )
  })

  it("has a time limit, so a request that hangs becomes an unknown outcome", () => {
    expect(PLACE_ORDER_TIMEOUT_MS).toBeGreaterThan(0)
    expect(PLACE_ORDER_TIMEOUT_MS).toBeLessThanOrEqual(60_000)
  })

  it("rejects as a network error when the connection is lost", async () => {
    api = mockApi(() => networkError())

    await expect(placeOrder(attempt)).rejects.toMatchObject({ status: 0 })
  })
})
