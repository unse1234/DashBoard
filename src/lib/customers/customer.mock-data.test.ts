import { RECENT_ORDERS_LIMIT } from "@/lib/customers/customer.constants"
import {
  getMockCustomerAddresses,
  getMockCustomerById,
  mockCustomers,
} from "@/lib/customers/customer.mock-data"
import { getMockCustomerRecentOrders } from "@/lib/customers/customer-order.mock-data"

// Amounts are compared in cents so adding them up can't drift.
function toCents(amount: number) {
  return Math.round(amount * 100)
}

describe("customer mock data", () => {
  it("has unique customer IDs that getMockCustomerById finds", () => {
    const ids = mockCustomers.map((customer) => customer.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const customer of mockCustomers) {
      expect(getMockCustomerById(customer.id)).toBe(customer)
    }
    expect(getMockCustomerById("CUS-0000")).toBeUndefined()
  })

  it("covers what the list has to show", () => {
    const statuses = new Set(mockCustomers.map((customer) => customer.status))

    expect(statuses).toEqual(new Set(["active", "inactive"]))
    expect(mockCustomers.some((customer) => customer.phone === null)).toBe(true)
    expect(mockCustomers.some((customer) => customer.totalOrders === 0)).toBe(true)
    // More than two pages at ten rows each.
    expect(mockCustomers.length).toBeGreaterThan(20)
  })
})

describe("customer order mock data", () => {
  it.each(mockCustomers)("agrees with the summary of $id", (customer) => {
    const orders = getMockCustomerRecentOrders(customer.id)

    expect(orders).toHaveLength(
      Math.min(customer.totalOrders, RECENT_ORDERS_LIMIT)
    )

    // Newest first, and never before the customer joined.
    const dates = orders.map((order) => order.createdAt)
    expect(dates).toEqual([...dates].sort().reverse())
    for (const date of dates) {
      expect(Date.parse(date)).toBeGreaterThanOrEqual(
        Date.parse(customer.joinedAt)
      )
    }

    expect(customer.lastOrderAt).toBe(orders[0]?.createdAt ?? null)

    const listedSpent = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + toCents(order.total), 0)

    if (customer.totalOrders <= RECENT_ORDERS_LIMIT) {
      // Every order is listed, so the total can be checked exactly.
      expect(listedSpent).toBe(toCents(customer.totalSpent))
    } else {
      expect(listedSpent).toBeLessThan(toCents(customer.totalSpent))
    }
  })

  it("only has orders for customers that exist, with unique IDs", () => {
    const orders = mockCustomers.flatMap((customer) =>
      getMockCustomerRecentOrders(customer.id)
    )
    const ids = orders.map((order) => order.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(orders.every((order) => getMockCustomerById(order.customerId))).toBe(
      true
    )
  })
})

describe("customer address mock data", () => {
  it("belongs to existing customers and has at most one default per type", () => {
    for (const customer of mockCustomers) {
      const addresses = getMockCustomerAddresses(customer.id)

      for (const type of ["shipping", "billing"] as const) {
        const defaults = addresses.filter(
          (address) => address.type === type && address.isDefault
        )
        expect(defaults.length).toBeLessThanOrEqual(1)
      }
    }

    const allIds = mockCustomers.flatMap((customer) =>
      getMockCustomerAddresses(customer.id).map((address) => address.id)
    )
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it("leaves some customers without any address", () => {
    expect(getMockCustomerAddresses("CUS-1066")).toEqual([])
  })
})
