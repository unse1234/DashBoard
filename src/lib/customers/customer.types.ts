import type { PageSize } from "@/lib/pagination"
import type { Sort } from "@/lib/sort"

export type Customer = {
  /** Public identifier, also used in the details route. */
  id: string
  name: string
  email: string
  /** As the customer typed it; null when none was given. */
  phone: string | null
  /** ISO 8601 timestamp. */
  joinedAt: string
  /** Orders placed, cancelled ones included. The API reports it; it is not counted from `CustomerOrderSummary`. */
  totalOrders: number
  /** Spent on orders that were not cancelled, in USD. */
  totalSpent: number
  /** ISO 8601 timestamp; null until the first order. */
  lastOrderAt: string | null
}

export type CustomerAddressType = "shipping" | "billing"

export type CustomerAddress = {
  id: string
  customerId: string
  type: CustomerAddressType
  recipientName: string
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  /** State, province or prefecture, where the country has one. */
  region: string | null
  postalCode: string | null
  country: string
  /** The address offered first for its type when a customer has several. */
  isDefault: boolean
}

export type CustomerOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

/**
 * What the customer details page shows of an order. The Orders module will
 * replace this with its own order type.
 */
export type CustomerOrderSummary = {
  /** Public identifier, which will also be the order's details route. */
  id: string
  customerId: string
  /** In USD. */
  total: number
  status: CustomerOrderStatus
  /** ISO 8601 timestamp. */
  createdAt: string
}

/** Everything the customer details page shows, from one API request. */
export type CustomerDetails = {
  customer: Customer
  addresses: CustomerAddress[]
  /** The latest orders, newest first; at most `RECENT_ORDERS_LIMIT`. */
  recentOrders: CustomerOrderSummary[]
}

/** The columns the list can be sorted by. */
export type CustomerSortColumn =
  | "id"
  | "name"
  | "email"
  | "totalOrders"
  | "totalSpent"
  | "joinedAt"

export type CustomerSort = Sort<CustomerSortColumn>

/**
 * Everything that decides which customers are listed; sent to the API as query
 * parameters. Without a sort the API returns the newest customers first.
 */
export type CustomersQuery = {
  search: string
  sort: CustomerSort | null
  page: number
  pageSize: PageSize
}
