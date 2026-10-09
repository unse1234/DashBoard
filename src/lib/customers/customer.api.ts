import { apiClient } from "@/lib/api/axios"
import type {
  Customer,
  CustomerAddress,
  CustomerDetails,
  CustomerOrderStatus,
  CustomerOrderSummary,
  CustomersQuery,
} from "@/lib/customers/customer.types"

// The API sends enums as stored, in upper case; the UI uses lower case.
type ApiAddressType = "SHIPPING" | "BILLING"
type ApiOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

type ApiCustomerAddress = Omit<CustomerAddress, "type"> & {
  type: ApiAddressType
}

type ApiCustomerOrderSummary = Omit<CustomerOrderSummary, "status"> & {
  status: ApiOrderStatus
}

type CustomerPageResponse = {
  data: Customer[]
  meta: { total: number }
}

type CustomerDetailsResponse = {
  customer: Customer
  addresses: ApiCustomerAddress[]
  recentOrders: ApiCustomerOrderSummary[]
}

export type CustomerPage = {
  customers: Customer[]
  totalRecords: number
}

const ADDRESS_TYPES = {
  SHIPPING: "shipping",
  BILLING: "billing",
} as const satisfies Record<ApiAddressType, CustomerAddress["type"]>

const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const satisfies Record<ApiOrderStatus, CustomerOrderStatus>

export function toCustomerAddress(
  address: ApiCustomerAddress
): CustomerAddress {
  return { ...address, type: ADDRESS_TYPES[address.type] }
}

export function toCustomerOrderSummary(
  order: ApiCustomerOrderSummary
): CustomerOrderSummary {
  return { ...order, status: ORDER_STATUSES[order.status] }
}

export function buildCustomersSearchParams({
  search,
  sort,
  page,
  pageSize,
}: CustomersQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search.trim()) params.set("search", search.trim())
  if (sort) {
    params.set("sortBy", sort.column)
    params.set("sortOrder", sort.direction)
  }
  return params
}

// Both need a signed-in user; the API client attaches the token.

export async function listCustomers(
  query: CustomersQuery,
  signal?: AbortSignal
): Promise<CustomerPage> {
  const { data } = await apiClient.get<CustomerPageResponse>("/customers", {
    params: buildCustomersSearchParams(query),
    signal,
  })
  return { customers: data.data, totalRecords: data.meta.total }
}

/** The customer, their addresses and their latest orders. */
export async function getCustomerDetails(
  customerId: string,
  signal?: AbortSignal
): Promise<CustomerDetails> {
  const { data } = await apiClient.get<CustomerDetailsResponse>(
    `/customers/${encodeURIComponent(customerId)}`,
    { signal }
  )
  return {
    customer: data.customer,
    addresses: data.addresses.map(toCustomerAddress),
    recentOrders: data.recentOrders.map(toCustomerOrderSummary),
  }
}
