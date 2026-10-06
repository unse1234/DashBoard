import type {
  Customer,
  CustomerSort,
  CustomerSortColumn,
  CustomersQuery,
} from "@/lib/customers/customer.types"
import { DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination"

export const defaultCustomersQuery: CustomersQuery = {
  search: "",
  status: "all",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

export type CustomersQueryResult = {
  /** The rows of the current page. */
  customers: Customer[]
  /** Customers matching the search and filters, across every page. */
  totalRecords: number
  /** The page these rows belong to; the last page when the query asked for one past it. */
  page: number
}

// Compares IDs by number ("CUS-1002" before "CUS-1010") and ignores case and accents.
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })

const comparators: Record<
  CustomerSortColumn,
  (a: Customer, b: Customer) => number
> = {
  id: (a, b) => collator.compare(a.id, b.id),
  name: (a, b) => collator.compare(a.name, b.name),
  email: (a, b) => collator.compare(a.email, b.email),
  totalOrders: (a, b) => a.totalOrders - b.totalOrders,
  totalSpent: (a, b) => a.totalSpent - b.totalSpent,
  status: (a, b) => collator.compare(a.status, b.status),
  joinedAt: (a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt),
}

// What a phone number may look like when typed into the search box.
const PHONE_SEARCH_PATTERN = /^[\d\s()+.-]+$/

function matchesSearch(customer: Customer, search: string) {
  const term = search.trim().toLowerCase()
  if (term === "") return true

  const fields = [customer.id, customer.name, customer.email, customer.phone]
  if (fields.some((field) => field?.toLowerCase().includes(term))) return true

  // Phones are stored as typed, so "415 555" has to find "+1 (415) 555-0132".
  if (customer.phone && PHONE_SEARCH_PATTERN.test(term)) {
    const digits = term.replace(/\D/g, "")
    return digits !== "" && customer.phone.replace(/\D/g, "").includes(digits)
  }

  return false
}

function sortCustomers(customers: Customer[], sort: CustomerSort | null) {
  if (!sort) return customers

  const compare = comparators[sort.column]
  const direction = sort.direction === "asc" ? 1 : -1

  return [...customers].sort((a, b) => compare(a, b) * direction)
}

/**
 * Searches, filters, sorts and pages `customers` in memory, the way the API
 * will do it for the same `query`. Once the API exists, this call is replaced
 * by the request that returns a `CustomersQueryResult`.
 */
export function queryCustomers(
  customers: readonly Customer[],
  query: CustomersQuery
): CustomersQueryResult {
  const matching = customers.filter(
    (customer) =>
      (query.status === "all" || customer.status === query.status) &&
      matchesSearch(customer, query.search)
  )
  const sorted = sortCustomers(matching, query.sort)

  const page = Math.min(query.page, getTotalPages(sorted.length, query.pageSize))
  const start = (page - 1) * query.pageSize

  return {
    customers: sorted.slice(start, start + query.pageSize),
    totalRecords: sorted.length,
    page,
  }
}
