import type {
  Order,
  OrderAddress,
  OrderCustomer,
  OrderItem,
  OrderListItem,
} from "@/types/order.types"

export function createOrderCustomer(
  overrides: Partial<OrderCustomer> = {}
): OrderCustomer {
  return {
    id: "CUS-1001",
    name: "Margaret Okafor-Williams",
    email: "margaret.okafor@brightwater.co.uk",
    phone: "+44 20 7946 0958",
    ...overrides,
  }
}

export function createOrderAddress(
  overrides: Partial<OrderAddress> = {}
): OrderAddress {
  return {
    recipientName: "Margaret Okafor-Williams",
    phone: "+44 20 7946 0958",
    addressLine1: "14 Alder Court",
    addressLine2: "Flat 3",
    city: "London",
    region: null,
    postalCode: "SE15 4QD",
    country: "United Kingdom",
    ...overrides,
  }
}

export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    productId: "PRD-2063",
    productName: "Trail Insulated Water Bottle, 750 ml",
    sku: "SPT-BTL-750-GRN",
    quantity: 2,
    unitPrice: 24.5,
    total: 49,
    ...overrides,
  }
}

/**
 * A row of the orders list; override fields per test. By default it is an order
 * that predates payment methods; a storefront order is `{ paymentMethod: "cod" }`.
 */
export function createOrderListItem(
  overrides: Partial<OrderListItem> = {}
): OrderListItem {
  return {
    id: "ORD-10001",
    customer: createOrderCustomer(),
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: null,
    currency: "PKR",
    itemCount: 2,
    total: 189.9,
    createdAt: "2026-09-29T08:40:00Z",
    ...overrides,
  }
}

/** A whole order: two bottles at 24.50, with shipping and tax. */
export function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    ...createOrderListItem({ total: 61.75 }),
    items: [createOrderItem()],
    subtotal: 49,
    shipping: 6.5,
    discount: 0,
    tax: 6.25,
    shippingAddress: createOrderAddress(),
    billingAddress: createOrderAddress(),
    ...overrides,
  }
}
