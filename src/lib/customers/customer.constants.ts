import type {
  CustomerAddressType,
  CustomerOrderStatus,
  CustomerStatus,
  CustomerStatusFilter,
} from "@/lib/customers/customer.types"

export const CUSTOMER_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
} as const satisfies Record<CustomerStatus, string>

export const CUSTOMER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: CUSTOMER_STATUS_LABELS.active },
  { value: "inactive", label: CUSTOMER_STATUS_LABELS.inactive },
] as const satisfies readonly { value: CustomerStatusFilter; label: string }[]

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
