import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { AxiosError } from "axios"
import { vi } from "vitest"

import { useBag } from "@/hooks/storefront/use-bag"
import { useOrderSubmission } from "@/hooks/storefront/use-order-submission"
import { BagProvider } from "@/providers/bag-provider"
import { quoteCheckout } from "@/services/storefront/checkout.api"
import { mockApi, networkError, type MockReply } from "@/test-utils/mock-api"
import { createTestQueryClient } from "@/test-utils/render"
import { createCheckoutServer } from "@/test-utils/storefront-checkout-server"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { PlaceOrderRequest } from "@/types/storefront/checkout.types"
import {
  ATTEMPT_STORAGE_KEY,
  CONFIRMATION_STORAGE_KEY,
} from "@/utils/storefront/order-session"

const kettle = createStorefrontProduct({
  id: "PRD-6001",
  name: "Kettle",
  price: 1500,
})
const mug = createStorefrontProduct({ id: "PRD-6002", name: "Mug", price: 250 })

const address = {
  recipientName: "Ayesha Khan",
  addressLine1: "House 12, Street 4",
  city: "Islamabad",
  region: "Islamabad Capital Territory",
  country: "PK",
}
const contact = {
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "0300 1234567",
}

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
  window.sessionStorage.clear()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

/** The bag holds the kettle, and the hook under test sits beside it. */
function setup(
  handler: (
    server: ReturnType<typeof createCheckoutServer>
  ) => (
    request: Parameters<ReturnType<typeof createCheckoutServer>["handle"]>[0],
    index: number
  ) => MockReply | Promise<MockReply>
) {
  const server = createCheckoutServer([kettle, mug])
  api = mockApi(handler(server))
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, "invalidateQueries")

  const rendered = renderHook(
    () => ({ submission: useOrderSubmission(), bag: useBag() }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <BagProvider
            persist={false}
            initialDraft={[{ productId: kettle.id, quantity: 2 }]}
          >
            {children}
          </BagProvider>
        </QueryClientProvider>
      ),
    }
  )
  return { server, invalidate, ...rendered }
}

/** A real quote from the fake server, as a request ready to place. */
async function quotedRequest(): Promise<PlaceOrderRequest> {
  const items = [{ productId: kettle.id, quantity: 2 }]
  const quote = await quoteCheckout({ items, shippingAddress: address })
  return {
    contact,
    items,
    shippingAddress: address,
    quoteToken: quote.quoteToken,
  }
}

const orderRequests = () =>
  api!.requests.filter((request) => request.url === "/storefront/orders")

describe("useOrderSubmission", () => {
  describe("placing an order", () => {
    it("freezes the attempt before sending it, and clears it once the order is confirmed", async () => {
      let storedWhileSending: string | null = null
      const { result, server } = setup((fake) => (request) => {
        if (request.url === "/storefront/orders") {
          storedWhileSending =
            window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)
        }
        return fake.handle(request)
      })
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      let outcome: Awaited<ReturnType<typeof result.current.submission.submit>>
      await act(async () => {
        outcome = await result.current.submission.submit(request)
      })

      expect(outcome!.type).toBe("placed")
      // On its way with its key, and recorded before it left.
      const [sent] = orderRequests()
      expect(sent.headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/)
      expect(sent.body).toEqual(request)
      expect(JSON.parse(storedWhileSending!)).toEqual({
        key: sent.headers["idempotency-key"],
        request,
      })
      // Done: nothing pending, the receipt kept, the bag emptied, one order.
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
      expect(
        JSON.parse(window.sessionStorage.getItem(CONFIRMATION_STORAGE_KEY)!)
      ).toMatchObject({
        receipt: { id: "ORD-10001", total: 3000 },
        delivery: { contactName: "Ayesha Khan" },
      })
      expect(result.current.submission.status).toBe("idle")
      expect(result.current.bag.items).toEqual([])
      expect(server.orders.size).toBe(1)
      expect(server.stockOf(kettle.id)).toBe(98)
    })

    it("refreshes what the dashboard and the catalog show of orders, customers and stock", async () => {
      const { result, invalidate } = setup((fake) => fake.handle)
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      await act(async () => {
        await result.current.submission.submit(request)
      })

      const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
      expect(keys).toEqual(
        expect.arrayContaining([
          ["orders"],
          ["customers"],
          ["products"],
          ["storefront", "catalog"],
        ])
      )
    })

    it("sends one request when the button is pressed twice at once", async () => {
      const { result } = setup((fake) => fake.handle)
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      await act(async () => {
        const first = result.current.submission.submit(request)
        const second = result.current.submission.submit(request)
        await Promise.all([first, second])
      })

      expect(orderRequests()).toHaveLength(1)
    })
  })

  describe("when the outcome is not known", () => {
    it.each([
      ["a lost connection", () => networkError()],
      ["a timeout", () => new AxiosError("timeout", AxiosError.ECONNABORTED)],
      [
        "a server failure",
        () => ({ status: 503, data: { statusCode: 503, message: "down" } }),
      ],
      [
        "being rate limited",
        () => ({ status: 429, data: { statusCode: 429, message: "slow" } }),
      ],
    ])("keeps the attempt after %s", async (_label, failure) => {
      const { result } = setup(
        (fake) => (request) =>
          request.url === "/storefront/orders"
            ? failure()
            : fake.handle(request)
      )
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      await act(async () => {
        const outcome = await result.current.submission.submit(request)
        expect(outcome.type).toBe("unconfirmed")
      })

      expect(result.current.submission.status).toBe("unconfirmed")
      expect(result.current.submission.attempt?.request).toEqual(request)
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).not.toBeNull()
      // The bag is not emptied for an order that may not exist.
      expect(result.current.bag.itemCount).toBe(2)
    })

    it("retries with the same key and request, and one order exists though the first answer was lost", async () => {
      let lost = true
      const { result, server } = setup((fake) => (request) => {
        const reply = fake.handle(request)
        // The server places the order; the answer never arrives.
        if (request.url === "/storefront/orders" && lost) {
          lost = false
          return networkError()
        }
        return reply
      })
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      await act(async () => {
        await result.current.submission.submit(request)
      })
      expect(server.orders.size).toBe(1)
      const stockAfterFirst = server.stockOf(kettle.id)

      await act(async () => {
        const outcome = await result.current.submission.retry()
        expect(outcome.type).toBe("placed")
      })

      const [first, again] = orderRequests()
      expect(again.headers["idempotency-key"]).toBe(
        first.headers["idempotency-key"]
      )
      expect(again.body).toEqual(first.body)
      expect(server.orders.size).toBe(1)
      expect(server.stockOf(kettle.id)).toBe(stockAfterFirst)
      expect(result.current.submission.status).toBe("idle")
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
    })

    it("does not start another order until the attempt is resolved", async () => {
      const { result } = setup(
        (fake) => (request) =>
          request.url === "/storefront/orders"
            ? networkError()
            : fake.handle(request)
      )
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()
      await act(async () => {
        await result.current.submission.submit(request)
      })
      expect(orderRequests()).toHaveLength(1)

      let outcome: Awaited<ReturnType<typeof result.current.submission.submit>>
      await act(async () => {
        outcome = await result.current.submission.submit({
          ...request,
          items: [{ productId: mug.id, quantity: 1 }],
        })
      })

      expect(outcome!.type).toBe("blocked")
      expect(orderRequests()).toHaveLength(1)
    })

    it("offers the pending attempt again after a reload", async () => {
      const { result, server } = setup((fake) => fake.handle)
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()
      window.sessionStorage.setItem(
        ATTEMPT_STORAGE_KEY,
        JSON.stringify({ key: "reloaded-attempt-0001", request })
      )

      // The tab was reloaded: a fresh hook finds the attempt in the session.
      const { result: reloaded } = renderHook(() => useOrderSubmission(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={createTestQueryClient()}>
            <BagProvider persist={false}>{children}</BagProvider>
          </QueryClientProvider>
        ),
      })
      await waitFor(() => expect(reloaded.current.status).toBe("unconfirmed"))
      expect(reloaded.current.attempt?.key).toBe("reloaded-attempt-0001")

      await act(async () => {
        const outcome = await reloaded.current.retry()
        expect(outcome.type).toBe("placed")
      })

      expect(orderRequests()[0].headers["idempotency-key"]).toBe(
        "reloaded-attempt-0001"
      )
      expect(server.orders.size).toBe(1)
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
    })
  })

  describe("when the API refuses the order", () => {
    it("forgets the attempt, says nothing was placed, and allows a new one", async () => {
      const { result, server } = setup((fake) => fake.handle)
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      // The quote ran out before the order was placed.
      server.setQuoteLifetime(-1000)
      const stale = await quotedRequest()

      await act(async () => {
        const outcome = await result.current.submission.submit(stale)
        expect(outcome.type).toBe("rejected")
      })

      expect(result.current.submission.status).toBe("rejected")
      expect(result.current.submission.rejection).toMatchObject({
        status: 409,
        code: "QUOTE_CHANGED",
        details: { reason: "QUOTE_EXPIRED" },
      })
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
      expect(result.current.bag.itemCount).toBe(2)
      expect(server.orders.size).toBe(0)

      // With a new quote it can be placed, under a new key.
      server.setQuoteLifetime(30 * 60 * 1000)
      const fresh = await quotedRequest()
      await act(async () => {
        const outcome = await result.current.submission.submit(fresh)
        expect(outcome.type).toBe("placed")
      })
      const keys = orderRequests().map((r) => r.headers["idempotency-key"])
      expect(new Set(keys).size).toBe(2)
    })

    it("can dismiss the refusal", async () => {
      const { result } = setup((fake) => fake.handle)
      await waitFor(() => expect(result.current.bag.itemCount).toBe(2))
      const request = await quotedRequest()

      await act(async () => {
        await result.current.submission.submit({
          ...request,
          quoteToken: "garbage",
        })
      })
      expect(result.current.submission.status).toBe("rejected")

      act(() => result.current.submission.dismissRejection())

      expect(result.current.submission.status).toBe("idle")
    })
  })
})
