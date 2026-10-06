import {
  getMockOrderById,
  mockOrders,
  mockOtherOrders,
  mockTotalOrders,
} from "@/lib/orders/order.mock-data"

const allOrders = [...mockOrders, ...mockOtherOrders]

function toCents(amount: number) {
  return Math.round(amount * 100)
}

describe("mockOrders", () => {
  it("has unique order IDs, newest first", () => {
    const ids = allOrders.map(({ id }) => id)
    const dates = allOrders.map(({ createdAt }) => Date.parse(createdAt))

    expect(new Set(ids).size).toBe(ids.length)
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it("has line totals that equal quantity × unit price", () => {
    for (const order of allOrders) {
      for (const item of order.items) {
        expect(toCents(item.total), `${order.id} ${item.id}`).toBe(
          toCents(item.quantity * item.unitPrice)
        )
      }
    }
  })

  it("has a subtotal that adds up the lines and a total that adds up the breakdown", () => {
    for (const order of allOrders) {
      const itemsTotal = order.items.reduce(
        (sum, item) => sum + toCents(item.total),
        0
      )

      expect(toCents(order.subtotal), `${order.id} subtotal`).toBe(itemsTotal)
      expect(toCents(order.total), `${order.id} total`).toBe(
        toCents(order.subtotal) +
          toCents(order.shipping) -
          toCents(order.discount) +
          toCents(order.tax)
      )
    }
  })

  it("has at least one item per order and a unique ID per item", () => {
    const itemIds = allOrders.flatMap(({ items }) => items.map(({ id }) => id))

    expect(allOrders.every(({ items }) => items.length > 0)).toBe(true)
    expect(new Set(itemIds).size).toBe(itemIds.length)
  })

  it("pairs each order status with a payment status that makes sense", () => {
    for (const order of allOrders) {
      if (order.status === "cancelled") {
        expect(["pending", "refunded"], order.id).toContain(order.paymentStatus)
      } else if (order.status === "shipped" || order.status === "delivered") {
        expect(order.paymentStatus, order.id).toBe("paid")
      } else {
        expect(order.paymentStatus, order.id).not.toBe("refunded")
      }
    }
  })

  it("covers every order status, every payment status and single and multi-item orders", () => {
    expect(new Set(allOrders.map(({ status }) => status))).toEqual(
      new Set(["pending", "processing", "shipped", "delivered", "cancelled"])
    )
    expect(new Set(allOrders.map(({ paymentStatus }) => paymentStatus))).toEqual(
      new Set(["pending", "paid", "refunded"])
    )
    expect(allOrders.some(({ items }) => items.length === 1)).toBe(true)
    expect(allOrders.some(({ items }) => items.length > 1)).toBe(true)
  })
})

describe("mock order pages", () => {
  it("lists one page of rows out of more orders than that", () => {
    expect(mockOrders).toHaveLength(10)
    expect(mockTotalOrders).toBe(allOrders.length)
    expect(mockTotalOrders).toBeGreaterThan(mockOrders.length)
  })
})

describe("getMockOrderById", () => {
  it("finds an order by its ID", () => {
    expect(getMockOrderById("ORD-31656")?.customer.name).toBe(
      "Margaret Okafor-Williams"
    )
  })

  it("also finds the orders that are not on the listed page", () => {
    expect(getMockOrderById("ORD-31224")?.status).toBe("cancelled")
  })

  it("returns undefined for an unknown ID", () => {
    expect(getMockOrderById("ORD-00000")).toBeUndefined()
  })
})
