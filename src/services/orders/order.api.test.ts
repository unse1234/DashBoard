import { vi } from "vitest"

import { attachSessionHandlers } from "@/lib/api/axios"
import {
  buildOrdersSearchParams,
  getOrder,
  listOrders,
  markOrderPaid,
  toOrder,
  toOrderListItem,
  updateOrderStatus,
} from "@/services/orders/order.api"
import { defaultOrdersQuery } from "@/screens/orders/order.filters"
import { createOrder, createOrderListItem } from "@/test-utils/order-fixtures"
import { mockApi } from "@/test-utils/mock-api"

/** What the API sends for an order: the UI's, with the enums as stored. */
function apiOrder(overrides: Record<string, unknown> = {}) {
  return {
    ...createOrder(),
    status: "SHIPPED",
    paymentStatus: "PAID",
    updatedAt: "2026-09-30T10:00:00Z",
    ...overrides,
  }
}

describe("buildOrdersSearchParams", () => {
  it("always sends the page and page size, and nothing else by default", () => {
    expect(buildOrdersSearchParams(defaultOrdersQuery).toString()).toBe(
      "page=1&pageSize=10"
    )
  })

  it("adds a trimmed search, the filters in the API's spelling and the sort", () => {
    const params = buildOrdersSearchParams({
      search: "  ada & co ",
      status: "cancelled",
      paymentStatus: "refunded",
      sort: { column: "itemCount", direction: "desc" },
      page: 3,
      pageSize: 50,
    })

    expect(params.get("search")).toBe("ada & co")
    expect(params.get("status")).toBe("CANCELLED")
    expect(params.get("paymentStatus")).toBe("REFUNDED")
    expect(params.get("sortBy")).toBe("itemCount")
    expect(params.get("sortOrder")).toBe("desc")
    expect(params.get("page")).toBe("3")
    expect(params.get("pageSize")).toBe("50")
    // The ampersand is encoded, not treated as a separator.
    expect(params.toString()).toContain("search=ada+%26+co")
  })

  it("omits a blank search, the 'all' filters and no sort", () => {
    const params = buildOrdersSearchParams({
      ...defaultOrdersQuery,
      search: "   ",
    })

    expect(params.has("search")).toBe(false)
    expect(params.has("status")).toBe(false)
    expect(params.has("paymentStatus")).toBe(false)
    expect(params.has("sortBy")).toBe(false)
    expect(params.has("sortOrder")).toBe(false)
  })
})

describe("enum mapping", () => {
  it.each([
    ["PENDING", "pending"],
    ["PROCESSING", "processing"],
    ["SHIPPED", "shipped"],
    ["DELIVERED", "delivered"],
    ["CANCELLED", "cancelled"],
  ] as const)("maps the order status %s to %s", (apiStatus, status) => {
    expect(
      toOrderListItem({
        ...createOrderListItem(),
        status: apiStatus,
        paymentStatus: "PAID",
      }).status
    ).toBe(status)
  })

  it.each([
    ["PENDING", "pending"],
    ["PAID", "paid"],
    ["REFUNDED", "refunded"],
  ] as const)("maps the payment status %s to %s", (apiStatus, status) => {
    expect(
      toOrderListItem({
        ...createOrderListItem(),
        status: "PENDING",
        paymentStatus: apiStatus,
      }).paymentStatus
    ).toBe(status)
  })

  it("keeps the rest of the order and drops what the UI does not use", () => {
    const order = toOrder(apiOrder() as never)

    expect(order).toEqual(createOrder())
    expect(order).not.toHaveProperty("updatedAt")
  })
})

describe("orders API calls", () => {
  let api: ReturnType<typeof mockApi>

  beforeEach(() => {
    attachSessionHandlers({
      getAccessToken: () => "token-1",
      requestRefresh: vi.fn(),
      updateSession: vi.fn(),
      clearSession: vi.fn(),
    })
  })

  afterEach(() => {
    api.restore()
  })

  it("lists a page of orders with the total, as an authenticated GET", async () => {
    api = mockApi(() => ({
      data: {
        data: [
          {
            ...createOrderListItem({ id: "ORD-1" }),
            status: "PENDING",
            paymentStatus: "PENDING",
          },
          {
            ...createOrderListItem({ id: "ORD-2" }),
            status: "SHIPPED",
            paymentStatus: "PAID",
          },
        ],
        meta: { page: 1, pageSize: 10, total: 42, totalPages: 5 },
      },
    }))
    const signal = new AbortController().signal

    const page = await listOrders(
      {
        ...defaultOrdersQuery,
        status: "pending",
        sort: { column: "total", direction: "asc" },
      },
      signal
    )

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/orders",
      headers: { authorization: "Bearer token-1" },
      signal,
    })
    expect(String(api.requests[0].params)).toBe(
      "page=1&pageSize=10&status=PENDING&sortBy=total&sortOrder=asc"
    )
    expect(page.totalRecords).toBe(42)
    expect(page.orders.map((o) => [o.id, o.status, o.paymentStatus])).toEqual([
      ["ORD-1", "pending", "pending"],
      ["ORD-2", "shipped", "paid"],
    ])
  })

  it("loads one order, encoding its id into the path", async () => {
    api = mockApi(() => ({ data: apiOrder() }))

    const order = await getOrder("ORD-10001")

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/orders/ORD-10001",
    })
    expect(order).toEqual(createOrder())

    await getOrder("a/b")
    expect(api.requests[1].url).toBe("/orders/a%2Fb")
  })

  it("moves an order to a status, sending it in the API's spelling", async () => {
    api = mockApi(() => ({
      data: apiOrder({ status: "CANCELLED", paymentStatus: "REFUNDED" }),
    }))

    const order = await updateOrderStatus("ORD-10001", "cancelled")

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/orders/ORD-10001/status",
      body: { status: "CANCELLED" },
    })
    expect(order).toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
    })
  })

  it("records a payment", async () => {
    api = mockApi(() => ({ data: apiOrder({ status: "PENDING" }) }))

    const order = await markOrderPaid("ORD-10001")

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/orders/ORD-10001/payment-status",
      body: { paymentStatus: "PAID" },
    })
    expect(order.paymentStatus).toBe("paid")
  })

  it("lets the API's refusal through, with its reason", async () => {
    api = mockApi(() => ({
      status: 409,
      data: { message: "A shipped order can't be cancelled." },
    }))

    await expect(
      updateOrderStatus("ORD-10001", "cancelled")
    ).rejects.toMatchObject({
      status: 409,
      message: "A shipped order can't be cancelled.",
    })
  })
})
