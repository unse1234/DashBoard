import { defaultOrdersQuery, queryOrders } from "@/lib/orders/order.query"
import type {
  Order,
  OrderItem,
  OrdersQuery,
} from "@/lib/orders/order.types"

function createItem(quantity: number): OrderItem {
  return {
    id: "item",
    productId: "PRD-2041",
    productName: "Product",
    sku: "SKU",
    quantity,
    unitPrice: 10,
    total: quantity * 10,
  }
}

function createOrder(overrides: Partial<Order> & { id: string }): Order {
  const address = {
    recipientName: "Recipient",
    phone: null,
    addressLine1: "1 Main Street",
    addressLine2: null,
    city: "City",
    region: null,
    postalCode: null,
    country: "Country",
  }

  return {
    customer: {
      id: "CUS-1001",
      name: "Customer",
      email: "customer@example.com",
      phone: null,
    },
    status: "pending",
    paymentStatus: "pending",
    items: [createItem(1)],
    subtotal: 10,
    shipping: 0,
    discount: 0,
    tax: 0,
    total: 10,
    shippingAddress: address,
    billingAddress: address,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

const orders: Order[] = [
  createOrder({
    id: "ORD-31624",
    customer: {
      id: "CUS-1012",
      name: "Tobias Lindqvist",
      email: "tobias@lindqvist.se",
      phone: "+46 8 555 012 34",
    },
    status: "shipped",
    paymentStatus: "paid",
    items: [createItem(2), createItem(1)],
    total: 94.5,
    createdAt: "2026-10-01T09:27:00Z",
  }),
  createOrder({
    id: "ORD-31640",
    customer: {
      id: "CUS-1024",
      name: "Omar Haddad",
      email: "omar.haddad@haddadtrading.ae",
      phone: null,
    },
    status: "pending",
    paymentStatus: "pending",
    total: 899,
    createdAt: "2026-10-03T12:10:00Z",
  }),
  createOrder({
    id: "ORD-31224",
    customer: {
      id: "CUS-1021",
      name: "Émile Chen",
      email: "emile@lotusgroup.sg",
      phone: null,
    },
    status: "cancelled",
    paymentStatus: "refunded",
    total: 79,
    createdAt: "2025-12-12T13:05:00Z",
  }),
  createOrder({
    id: "ORD-31656",
    customer: {
      id: "CUS-1001",
      name: "Margaret Okafor-Williams",
      email: "margaret.okafor@brightwater.co.uk",
      phone: "+44 20 7946 0958",
    },
    status: "processing",
    paymentStatus: "paid",
    items: [createItem(1)],
    total: 329,
    createdAt: "2026-10-04T14:22:00Z",
  }),
  createOrder({
    id: "ORD-31588",
    status: "delivered",
    paymentStatus: "paid",
    items: [createItem(4)],
    total: 158,
    createdAt: "2026-09-21T03:15:00Z",
  }),
]

function query(changes: Partial<OrdersQuery> = {}): OrdersQuery {
  return { ...defaultOrdersQuery, ...changes }
}

function getIds(changes?: Partial<OrdersQuery>) {
  return queryOrders(orders, query(changes)).orders.map(({ id }) => id)
}

describe("queryOrders search", () => {
  it("returns every order for an empty or blank search", () => {
    expect(getIds({ search: "" })).toHaveLength(orders.length)
    expect(getIds({ search: "   " })).toHaveLength(orders.length)
  })

  it("finds an order by its ID, whole or in part", () => {
    expect(getIds({ search: "ORD-31640" })).toEqual(["ORD-31640"])
    expect(getIds({ search: "31640" })).toEqual(["ORD-31640"])
  })

  it("finds orders by customer name and email, ignoring case and spaces", () => {
    expect(getIds({ search: "  margaret okafor " })).toEqual(["ORD-31656"])
    expect(getIds({ search: "HADDADTRADING" })).toEqual(["ORD-31640"])
  })

  it("does not match on fields the search box does not name", () => {
    expect(getIds({ search: "CUS-1001" })).toEqual([])
    expect(getIds({ search: "555 012" })).toEqual([])
  })
})

describe("queryOrders filters", () => {
  it("filters by order status", () => {
    expect(getIds({ status: "shipped" })).toEqual(["ORD-31624"])
    expect(getIds({ status: "cancelled" })).toEqual(["ORD-31224"])
  })

  it("filters by payment status", () => {
    expect(getIds({ paymentStatus: "pending" })).toEqual(["ORD-31640"])
    expect(getIds({ paymentStatus: "refunded" })).toEqual(["ORD-31224"])
    expect(getIds({ paymentStatus: "paid" })).toEqual([
      "ORD-31624",
      "ORD-31656",
      "ORD-31588",
    ])
  })

  it("combines the search and both filters", () => {
    expect(
      getIds({ search: "ord-316", status: "shipped", paymentStatus: "paid" })
    ).toEqual(["ORD-31624"])
    expect(getIds({ status: "shipped", paymentStatus: "pending" })).toEqual([])
  })
})

describe("queryOrders sorting", () => {
  it("keeps the given order when there is no sort", () => {
    expect(getIds()).toEqual(orders.map(({ id }) => id))
  })

  it("sorts IDs by number", () => {
    expect(getIds({ sort: { column: "id", direction: "asc" } })).toEqual([
      "ORD-31224",
      "ORD-31588",
      "ORD-31624",
      "ORD-31640",
      "ORD-31656",
    ])
  })

  it("sorts by customer name, ignoring accents and case", () => {
    const names = queryOrders(
      orders,
      query({ sort: { column: "customer", direction: "asc" } })
    ).orders.map(({ customer }) => customer.name)

    expect(names).toEqual([
      "Customer",
      "Émile Chen",
      "Margaret Okafor-Williams",
      "Omar Haddad",
      "Tobias Lindqvist",
    ])
  })

  it("sorts by date, oldest first when ascending", () => {
    expect(getIds({ sort: { column: "createdAt", direction: "asc" } })[0]).toBe(
      "ORD-31224"
    )
    expect(getIds({ sort: { column: "createdAt", direction: "desc" } })[0]).toBe(
      "ORD-31656"
    )
  })

  it("sorts by the number of items, counting quantities", () => {
    expect(getIds({ sort: { column: "itemCount", direction: "desc" } })[0]).toBe(
      "ORD-31588"
    )
    expect(getIds({ sort: { column: "itemCount", direction: "asc" } })[0]).not.toBe(
      "ORD-31588"
    )
  })

  it("sorts amounts by value, not as text", () => {
    expect(getIds({ sort: { column: "total", direction: "asc" } })).toEqual([
      "ORD-31224",
      "ORD-31624",
      "ORD-31588",
      "ORD-31656",
      "ORD-31640",
    ])
  })

  it("sorts statuses by how far along they are", () => {
    expect(getIds({ sort: { column: "status", direction: "asc" } })).toEqual([
      "ORD-31640",
      "ORD-31656",
      "ORD-31624",
      "ORD-31588",
      "ORD-31224",
    ])
  })

  it("sorts payment statuses as pending, paid, refunded", () => {
    const ids = getIds({ sort: { column: "paymentStatus", direction: "asc" } })

    expect(ids[0]).toBe("ORD-31640")
    expect(ids[ids.length - 1]).toBe("ORD-31224")
  })

  it("reverses the order when descending", () => {
    expect(getIds({ sort: { column: "total", direction: "desc" } })).toEqual(
      getIds({ sort: { column: "total", direction: "asc" } }).reverse()
    )
  })

  it("does not change the orders it was given", () => {
    const before = orders.map(({ id }) => id)

    queryOrders(orders, query({ sort: { column: "total", direction: "asc" } }))

    expect(orders.map(({ id }) => id)).toEqual(before)
  })
})

describe("queryOrders paging", () => {
  it("returns one page of rows and the total across pages", () => {
    const result = queryOrders(orders, query({ pageSize: 10 }))

    expect(result.orders).toHaveLength(5)
    expect(result.totalRecords).toBe(5)
    expect(result.page).toBe(1)
  })

  it("slices the requested page", () => {
    const manyOrders = Array.from({ length: 23 }, (_, index) =>
      createOrder({ id: `ORD-${30000 + index}` })
    )

    const second = queryOrders(manyOrders, query({ page: 2, pageSize: 10 }))
    const third = queryOrders(manyOrders, query({ page: 3, pageSize: 10 }))

    expect(second.orders[0]?.id).toBe("ORD-30010")
    expect(third.orders.map(({ id }) => id)).toEqual([
      "ORD-30020",
      "ORD-30021",
      "ORD-30022",
    ])
    expect(third.totalRecords).toBe(23)
  })

  it("counts the matches, not every order, and falls back to the last page", () => {
    const result = queryOrders(orders, query({ status: "shipped", page: 4 }))

    expect(result.totalRecords).toBe(1)
    expect(result.page).toBe(1)
    expect(result.orders).toHaveLength(1)
  })

  it("returns an empty page when nothing matches", () => {
    const result = queryOrders(orders, query({ search: "no such order" }))

    expect(result).toEqual({ orders: [], totalRecords: 0, page: 1 })
  })
})
