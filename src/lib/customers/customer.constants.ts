import type {
  CustomerAddressType,
  CustomerOrderStatus,
} from "@/lib/customers/customer.types"

export const CUSTOMER_ORDER_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const satisfies Record<CustomerOrderStatus, string>

/** The kinds of address the details page shows, in the order it shows them. */
export const CUSTOMER_ADDRESS_GROUPS = [
  { type: "shipping", label: "Shipping address" },
  { type: "billing", label: "Billing address" },
] as const satisfies readonly { type: CustomerAddressType; label: string }[]

/** How many of a customer's latest orders the details page lists. */
export const RECENT_ORDERS_LIMIT = 3
