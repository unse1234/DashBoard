import type { ReactNode } from "react"
import { act, renderHook, screen, waitFor } from "@testing-library/react"

import { useBag } from "@/hooks/storefront/use-bag"
import { BagProvider } from "@/providers/bag-provider"
import { mockApi, networkError, type MockReply } from "@/test-utils/mock-api"
import { createBagServer } from "@/test-utils/storefront-bag-server"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { BagDraftLine } from "@/types/storefront/bag.types"
import { BAG_STORAGE_KEY } from "@/utils/storefront/bag-storage"

const kettle = createStorefrontProduct({
  id: "PRD-2001",
  name: "Kettle",
  subtitle: "Steel",
  price: 199.99,
})
const mug = createStorefrontProduct({
  id: "PRD-2002",
  name: "Mug",
  price: 0.1,
})
const lamp = createStorefrontProduct({
  id: "PRD-2003",
  name: "Gone Lamp",
  subtitle: "Brass",
  inStock: false,
})

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
  window.localStorage.clear()
})

function renderBag(
  props: { initialDraft?: BagDraftLine[]; persist?: boolean } = {}
) {
  return renderHook(() => useBag(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <BagProvider persist={false} {...props}>
        {children}
      </BagProvider>
    ),
  })
}

const bodies = () => api!.requests.map((request) => request.body)

describe("BagProvider", () => {
  describe("a new visit", () => {
    it("starts with an empty bag and asks the server nothing", () => {
      api = mockApi(() => ({ status: 500 }))
      const { result } = renderBag()

      expect(result.current.items).toEqual([])
      expect(result.current.itemCount).toBe(0)
      expect(result.current.subtotal).toBe(0)
      expect(result.current.currency).toBe("PKR")
      expect(result.current.isRestoring).toBe(false)
      expect(api.requests).toHaveLength(0)
    })

    it("sends the shopper's intent as an action and shows the server's bag", async () => {
      api = mockApi(createBagServer([kettle, mug]).handle)
      const { result } = renderBag()

      act(() => result.current.addProduct(kettle))

      await waitFor(() => expect(result.current.itemCount).toBe(1))
      expect(bodies()).toEqual([
        { items: [], action: { type: "add", productId: "PRD-2001" } },
      ])
      expect(api.requests[0].url).toBe("/storefront/bag/quote")
      expect(api.requests[0].headers.authorization).toBeUndefined()
      expect(result.current.items[0]).toMatchObject({
        productId: "PRD-2001",
        quantity: 1,
        unitPrice: 199.99,
        lineTotal: 199.99,
        issue: null,
      })
      expect(result.current.subtotal).toBe(199.99)
      expect(screen.getByRole("status")).toHaveTextContent(
        "Kettle, Steel, added to bag. Quantity 1."
      )
    })

    it("never does arithmetic: counts and totals are the server's", async () => {
      api = mockApi(createBagServer([kettle, mug]).handle)
      const { result } = renderBag()

      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))
      act(() => result.current.addProduct(mug))
      await waitFor(() => expect(result.current.lineCount).toBe(2))
      act(() => result.current.increase(mug.id))
      act(() => result.current.increase(mug.id))
      await waitFor(() => expect(result.current.itemCount).toBe(4))

      // 199.99 + 3 x 0.10: a sum floating point gets wrong, and not ours to do.
      expect(result.current.subtotal).toBe(200.29)
      expect(result.current.items.map((line) => line.quantity)).toEqual([1, 3])
    })

    it("sends back only ids and quantities, never prices or products", async () => {
      api = mockApi(createBagServer([kettle, mug]).handle)
      const { result } = renderBag()

      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))
      act(() => result.current.addProduct(mug))
      await waitFor(() => expect(result.current.lineCount).toBe(2))

      expect(bodies()[1]).toEqual({
        items: [{ productId: "PRD-2001", quantity: 1 }],
        action: { type: "add", productId: "PRD-2002" },
      })
    })
  })

  describe("intents", () => {
    async function withKettle(quantity = 1) {
      api = mockApi(createBagServer([kettle, mug]).handle)
      const rendered = renderBag({
        initialDraft: [{ productId: kettle.id, quantity }],
      })
      await waitFor(() =>
        expect(rendered.result.current.itemCount).toBe(quantity)
      )
      return rendered
    }

    it.each([
      ["increase", "increment", 3],
      ["decrease", "decrement", 1],
    ] as const)("%s sends %s", async (method, type, expected) => {
      const { result } = await withKettle(2)

      act(() => result.current[method](kettle.id))

      await waitFor(() => expect(result.current.itemCount).toBe(expected))
      expect(bodies().at(-1)).toEqual({
        items: [{ productId: kettle.id, quantity: 2 }],
        action: { type, productId: kettle.id },
      })
    })

    it("lets the server drop a line that decreases from one", async () => {
      const { result } = await withKettle(1)

      act(() => result.current.decrease(kettle.id))

      await waitFor(() => expect(result.current.items).toEqual([]))
      expect(result.current.itemCount).toBe(0)
    })

    it("removes a line whatever its quantity", async () => {
      const { result } = await withKettle(5)

      act(() => result.current.remove(kettle.id))

      await waitFor(() => expect(result.current.items).toEqual([]))
      expect(bodies().at(-1)).toMatchObject({
        action: { type: "remove", productId: kettle.id },
      })
    })
  })

  describe("ordering", () => {
    it("sends one request at a time, each from the bag the last one produced", async () => {
      const server = createBagServer([kettle])
      const held: { request: unknown; release: () => void }[] = []
      api = mockApi(
        (request) =>
          new Promise<MockReply>((resolve) => {
            held.push({
              request: request.body,
              release: () => resolve(server.handle(request)),
            })
          })
      )
      const { result } = renderBag()

      // Three clicks before the first answer.
      act(() => {
        result.current.addProduct(kettle)
        result.current.increase(kettle.id)
        result.current.increase(kettle.id)
      })
      await waitFor(() => expect(held).toHaveLength(1))
      expect(result.current.isUpdating).toBe(true)
      expect(result.current.itemCount).toBe(0)

      await act(async () => held[0].release())
      await waitFor(() => expect(held).toHaveLength(2))
      // The second request started from the first one's answer.
      expect(held[1].request).toEqual({
        items: [{ productId: kettle.id, quantity: 1 }],
        action: { type: "increment", productId: kettle.id },
      })
      expect(result.current.itemCount).toBe(1)

      await act(async () => held[1].release())
      await waitFor(() => expect(held).toHaveLength(3))
      expect(held[2].request).toEqual({
        items: [{ productId: kettle.id, quantity: 2 }],
        action: { type: "increment", productId: kettle.id },
      })

      await act(async () => held[2].release())
      await waitFor(() => expect(result.current.itemCount).toBe(3))
      expect(result.current.isUpdating).toBe(false)
    })

    it("keeps going after a request failed", async () => {
      const server = createBagServer([kettle])
      let calls = 0
      api = mockApi((request) => {
        calls += 1
        return calls === 1 ? networkError() : server.handle(request)
      })
      const { result } = renderBag()

      act(() => {
        result.current.addProduct(kettle)
        result.current.addProduct(kettle)
      })

      await waitFor(() => expect(result.current.itemCount).toBe(1))
      expect(calls).toBe(2)
    })
  })

  describe("refusals", () => {
    it("explains a product that cannot be bought in that quantity, and changes nothing", async () => {
      api = mockApi(createBagServer([kettle, lamp]).handle)
      const { result } = renderBag({
        initialDraft: [{ productId: kettle.id, quantity: 1 }],
      })
      await waitFor(() => expect(result.current.itemCount).toBe(1))

      act(() => result.current.addProduct(lamp))

      await waitFor(() => expect(result.current.notice).not.toBeNull())
      expect(result.current.notice?.message).toBe(
        "Gone Lamp, Brass: There is not enough stock for this quantity"
      )
      // The bag is exactly what it was, and the server does not say how many are left.
      expect(result.current.items.map((line) => line.productId)).toEqual([
        kettle.id,
      ])
      expect(result.current.itemCount).toBe(1)
      expect(result.current.isUpdating).toBe(false)
    })

    it("clears the notice with the next change that works, or when dismissed", async () => {
      api = mockApi(createBagServer([kettle, lamp]).handle)
      const { result } = renderBag()

      act(() => result.current.addProduct(lamp))
      await waitFor(() => expect(result.current.notice).not.toBeNull())
      act(() => result.current.dismissNotice())
      expect(result.current.notice).toBeNull()

      act(() => result.current.addProduct(lamp))
      await waitFor(() => expect(result.current.notice).not.toBeNull())
      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))
      expect(result.current.notice).toBeNull()
    })

    it("tells the shopper when the server cannot be reached, and keeps the bag", async () => {
      const server = createBagServer([kettle])
      let down = false
      api = mockApi((request) =>
        down ? networkError() : server.handle(request)
      )
      const { result } = renderBag()
      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))

      down = true
      act(() => result.current.increase(kettle.id))

      await waitFor(() => expect(result.current.notice).not.toBeNull())
      expect(result.current.notice?.message).toMatch(
        /unable to reach the server/i
      )
      expect(result.current.itemCount).toBe(1)

      down = false
      act(() => result.current.increase(kettle.id))
      await waitFor(() => expect(result.current.itemCount).toBe(2))
    })
  })

  describe("lines that went bad", () => {
    it("exposes the server's issue and blocks checkout through hasIssues", async () => {
      const server = createBagServer([kettle], { [kettle.id]: 1 })
      api = mockApi(server.handle)
      const { result } = renderBag({
        initialDraft: [
          { productId: kettle.id, quantity: 3 },
          { productId: "PRD-9999", quantity: 1 },
        ],
      })

      await waitFor(() => expect(result.current.hasIssues).toBe(true))
      expect(result.current.items.map((line) => line.issue)).toEqual([
        "INSUFFICIENT_STOCK",
        "PRODUCT_UNAVAILABLE",
      ])
      expect(result.current.items[1].product).toBeNull()
    })
  })

  describe("restoring a bag", () => {
    it("prices the bag the last visit left, saying it is loading until the answer", async () => {
      window.localStorage.setItem(
        BAG_STORAGE_KEY,
        JSON.stringify([{ productId: kettle.id, quantity: 2 }])
      )
      api = mockApi(createBagServer([kettle]).handle)
      const { result } = renderBag({ persist: true })

      await waitFor(() => expect(result.current.itemCount).toBe(2))
      expect(bodies()).toEqual([
        { items: [{ productId: kettle.id, quantity: 2 }] },
      ])
      expect(result.current.isRestoring).toBe(false)
      expect(result.current.subtotal).toBe(399.98)
    })

    it("reports a bag that is still loading", async () => {
      let release: () => void = () => {}
      const server = createBagServer([kettle])
      api = mockApi(
        (request) =>
          new Promise<MockReply>((resolve) => {
            release = () => resolve(server.handle(request))
          })
      )
      const { result } = renderBag({
        initialDraft: [{ productId: kettle.id, quantity: 1 }],
      })

      await waitFor(() => expect(result.current.isRestoring).toBe(true))
      expect(result.current.items).toEqual([])

      await act(async () => release())
      await waitFor(() => expect(result.current.isRestoring).toBe(false))
      expect(result.current.itemCount).toBe(1)
    })

    it("keeps the draft when the server cannot be reached, and loads on retry", async () => {
      const server = createBagServer([kettle])
      let down = true
      api = mockApi((request) =>
        down ? networkError() : server.handle(request)
      )
      const { result } = renderBag({
        initialDraft: [{ productId: kettle.id, quantity: 2 }],
      })

      await waitFor(() => expect(result.current.loadError).not.toBeNull())
      expect(result.current.items).toEqual([])
      expect(result.current.isRestoring).toBe(false)

      down = false
      act(() => result.current.refresh())

      await waitFor(() => expect(result.current.itemCount).toBe(2))
      expect(result.current.loadError).toBeNull()
    })
  })

  describe("persistence", () => {
    it("remembers only ids and quantities between visits", async () => {
      api = mockApi(createBagServer([kettle, mug]).handle)
      const { result } = renderBag({ persist: true })

      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))
      act(() => result.current.increase(kettle.id))
      await waitFor(() => expect(result.current.itemCount).toBe(2))

      expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBe(
        '[{"productId":"PRD-2001","quantity":2}]'
      )
    })

    it("does not touch storage when persistence is off", async () => {
      api = mockApi(createBagServer([kettle]).handle)
      const { result } = renderBag({ persist: false })

      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))

      expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBeNull()
    })
  })

  describe("refresh and clear", () => {
    it("asks nothing about an empty bag", () => {
      api = mockApi(createBagServer([kettle]).handle)
      const { result } = renderBag()

      act(() => result.current.refresh())

      expect(api.requests).toHaveLength(0)
    })

    it("prices the bag again as it is, without an action", async () => {
      api = mockApi(createBagServer([kettle]).handle)
      const { result } = renderBag({
        initialDraft: [{ productId: kettle.id, quantity: 1 }],
      })
      await waitFor(() => expect(result.current.itemCount).toBe(1))

      act(() => result.current.refresh())

      await waitFor(() => expect(api!.requests).toHaveLength(2))
      expect(bodies()[1]).toEqual({
        items: [{ productId: kettle.id, quantity: 1 }],
      })
    })

    it("empties the bag and storage without asking the server", async () => {
      api = mockApi(createBagServer([kettle]).handle)
      const { result } = renderBag({ persist: true })
      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(result.current.itemCount).toBe(1))
      const sent = api.requests.length

      act(() => result.current.clear())

      expect(result.current.items).toEqual([])
      expect(result.current.itemCount).toBe(0)
      expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBeNull()
      expect(api.requests).toHaveLength(sent)
    })

    it("ignores the answer to a request made before the bag was cleared", async () => {
      const server = createBagServer([kettle])
      let release: () => void = () => {}
      api = mockApi(
        (request) =>
          new Promise<MockReply>((resolve) => {
            release = () => resolve(server.handle(request))
          })
      )
      const { result } = renderBag({ persist: true })
      act(() => result.current.addProduct(kettle))
      await waitFor(() => expect(api!.requests).toHaveLength(1))

      act(() => result.current.clear())
      await act(async () => release())

      expect(result.current.items).toEqual([])
      expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBeNull()
    })
  })
})
