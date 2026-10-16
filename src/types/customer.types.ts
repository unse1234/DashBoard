import type { RecordedCurrency } from "@/types/currency.types"
import type { PageSize } from "@/types/pagination.types";
import type { Sort } from "@/types/sort.types";

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
  /**
   * Spent on orders that were not cancelled, with every currency added together
   * as a bare number. It only means something while a customer has orders in a
   * single currency, so the API keeps it for sorting: show `spentByCurrency`.
   */
  totalSpent: number
  /**
   * The same, per recorded currency. Only the currencies the
   * customer has orders in; empty before the first one.
   */
  spentByCurrency: { currency: RecordedCurrency; amount: number }[]
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
  /** In `currency`. */
  total: number
  /** What `total` is denominated in: the order's currency. */
  currency: RecordedCurrency
  status: CustomerOrderStatus
  /** ISO 8601 timestamp. */
  createdAt: string
}

/**
 * An address the customer's orders were delivered to, as the order recorded it.
 * A guest checkout saves no address on the customer, so for those customers
 * this is the only place an address shows.
 */
export type CustomerOrderAddress = {
  address: Pick<
    CustomerAddress,
    | "recipientName"
    | "phone"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "region"
    | "postalCode"
    | "country"
  >
  /** ISO 8601: when the newest order delivered there was placed. */
  lastUsedAt: string
  /** How many of the customer's orders were delivered there. */
  orderCount: number
}

/** Everything the customer details page shows, from one API request. */
export type CustomerDetails = {
  customer: Customer
  /** What the customer saved. */
  addresses: CustomerAddress[]
  /** Where their orders were delivered, newest first. */
  orderAddresses: CustomerOrderAddress[]
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

export type CustomerPage = {
  customers: Customer[]
  totalRecords: number
}
