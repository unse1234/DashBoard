import type { OrderItem, OrderStatus } from "@/lib/orders/order.types"
import {
  getAvailableOrderStatuses,
  getOrderAddressLines,
  getOrderItemCount,
  getStatusChangeMessage,
} from "@/lib/orders/order.utils"

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

describe("getOrderItemCount", () => {
  it("adds up the quantities, not the lines", () => {
    expect(
      getOrderItemCount({ items: [createItem(2), createItem(1), createItem(4)] })
    ).toBe(7)
  })

  it("is zero without items", () => {
    expect(getOrderItemCount({ items: [] })).toBe(0)
  })
})

describe("getAvailableOrderStatuses", () => {
  const cases: [OrderStatus, OrderStatus[]][] = [
    ["pending", ["pending", "processing", "shipped", "delivered", "cancelled"]],
    ["processing", ["processing", "shipped", "delivered", "cancelled"]],
    ["shipped", ["shipped", "delivered", "cancelled"]],
    ["delivered", ["delivered"]],
    ["cancelled", ["cancelled"]],
  ]

  it.each(cases)("offers %s orders %j", (current, expected) => {
    expect(getAvailableOrderStatuses(current)).toEqual(expected)
  })
})

describe("getStatusChangeMessage", () => {
  it("names the order and the new status", () => {
    expect(getStatusChangeMessage("ORD-31656", "shipped")).toBe(
      "Order ORD-31656 is now shipped."
    )
  })
})

describe("getOrderAddressLines", () => {
  it("lists the street, the city line and the country", () => {
    expect(
      getOrderAddressLines({
        addressLine1: "88 Hayes Street",
        addressLine2: "Apt 12",
        city: "San Francisco",
        region: "CA",
        postalCode: "94102",
        country: "United States",
      })
    ).toEqual([
      "88 Hayes Street",
      "Apt 12",
      "San Francisco, CA 94102",
      "United States",
    ])
  })

  it("leaves out the lines that are not set", () => {
    expect(
      getOrderAddressLines({
        addressLine1: "Villa 22, Street 14, Al Barsha 2",
        addressLine2: null,
        city: "Dubai",
        region: null,
        postalCode: null,
        country: "United Arab Emirates",
      })
    ).toEqual([
      "Villa 22, Street 14, Al Barsha 2",
      "Dubai",
      "United Arab Emirates",
    ])
  })
})
