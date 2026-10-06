import {
  defaultCustomersQuery,
  queryCustomers,
} from "@/lib/customers/customer.query"
import type {
  Customer,
  CustomersQuery,
} from "@/lib/customers/customer.types"

function createCustomer(overrides: Partial<Customer> & { id: string }): Customer {
  return {
    name: "Customer",
    email: "customer@example.com",
    phone: null,
    status: "active",
    joinedAt: "2025-01-01T00:00:00Z",
    totalOrders: 0,
    totalSpent: 0,
    lastOrderAt: null,
    ...overrides,
  }
}

const customers: Customer[] = [
  createCustomer({
    id: "CUS-1002",
    name: "Daniel Reyes",
    email: "daniel.reyes@gmail.com",
    phone: "+1 (415) 555-0132",
    totalOrders: 23,
    totalSpent: 6212.4,
    joinedAt: "2022-05-19T16:42:00Z",
  }),
  createCustomer({
    id: "CUS-1010",
    name: "Émile Dubois",
    email: "emile@dubois.fr",
    phone: null,
    status: "inactive",
    totalOrders: 2,
    totalSpent: 189.98,
    joinedAt: "2023-04-28T12:12:00Z",
  }),
  createCustomer({
    id: "CUS-1003",
    name: "Aiko Tanabe",
    email: "aiko.tanabe@sakuramail.jp",
    phone: "+81 3 5550 1234",
    status: "inactive",
    totalOrders: 14,
    totalSpent: 3894.1,
    joinedAt: "2022-08-02T03:20:00Z",
  }),
  createCustomer({
    id: "CUS-1001",
    name: "Emile Zola",
    email: "zola@example.org",
    // Contains 1003, which is also another customer's ID.
    phone: "+44 20 1003 0958",
    totalOrders: 23,
    totalSpent: 100,
    joinedAt: "2024-01-21T13:47:00Z",
  }),
]

function query(changes: Partial<CustomersQuery> = {}) {
  return { ...defaultCustomersQuery, ...changes }
}

function getIds(changes: Partial<CustomersQuery> = {}) {
  return queryCustomers(customers, query(changes)).customers.map(
    (customer) => customer.id
  )
}

describe("queryCustomers search", () => {
  it("returns every customer in their given order without a search or sort", () => {
    expect(getIds()).toEqual(["CUS-1002", "CUS-1010", "CUS-1003", "CUS-1001"])
  })

  it("finds a customer by ID, name or email, ignoring case", () => {
    expect(getIds({ search: "cus-1003" })).toEqual(["CUS-1003"])
    expect(getIds({ search: "DANIEL" })).toEqual(["CUS-1002"])
    expect(getIds({ search: "sakuramail" })).toEqual(["CUS-1003"])
  })

  it("ignores spaces around the search", () => {
    expect(getIds({ search: "  zola  " })).toEqual(["CUS-1001"])
  })

  it("finds a phone number however it is formatted", () => {
    expect(getIds({ search: "+44 20" })).toEqual(["CUS-1001"])
    expect(getIds({ search: "415-555" })).toEqual(["CUS-1002"])
    expect(getIds({ search: "(415) 555" })).toEqual(["CUS-1002"])
    expect(getIds({ search: "0132" })).toEqual(["CUS-1002"])
  })

  it("only compares phone digits when the search looks like a phone number", () => {
    expect(getIds({ search: "cus-1003" })).toEqual(["CUS-1003"])
    expect(getIds({ search: "1003" })).toEqual(["CUS-1003", "CUS-1001"])
  })

  it("returns nothing when no customer matches", () => {
    const result = queryCustomers(customers, query({ search: "nobody" }))

    expect(result.customers).toEqual([])
    expect(result.totalRecords).toBe(0)
    expect(result.page).toBe(1)
  })
})

describe("queryCustomers status filter", () => {
  it("keeps only customers with the chosen status", () => {
    expect(getIds({ status: "inactive" })).toEqual(["CUS-1010", "CUS-1003"])
    expect(getIds({ status: "active" })).toEqual(["CUS-1002", "CUS-1001"])
  })

  it("combines with the search", () => {
    expect(getIds({ status: "inactive", search: "aiko" })).toEqual(["CUS-1003"])
    expect(getIds({ status: "active", search: "aiko" })).toEqual([])
  })
})

describe("queryCustomers sorting", () => {
  it("sorts IDs by number, not character by character", () => {
    expect(getIds({ sort: { column: "id", direction: "asc" } })).toEqual([
      "CUS-1001",
      "CUS-1002",
      "CUS-1003",
      "CUS-1010",
    ])
  })

  it("sorts names ignoring case and accents", () => {
    expect(getIds({ sort: { column: "name", direction: "asc" } })).toEqual([
      "CUS-1003",
      "CUS-1002",
      "CUS-1010",
      "CUS-1001",
    ])
  })

  it("sorts by email", () => {
    expect(getIds({ sort: { column: "email", direction: "asc" } })).toEqual([
      "CUS-1003",
      "CUS-1002",
      "CUS-1010",
      "CUS-1001",
    ])
  })

  it("sorts the numeric columns by value", () => {
    expect(
      getIds({ sort: { column: "totalSpent", direction: "desc" } })
    ).toEqual(["CUS-1002", "CUS-1003", "CUS-1010", "CUS-1001"])
    expect(
      getIds({ sort: { column: "totalOrders", direction: "asc" } })
    ).toEqual(["CUS-1010", "CUS-1003", "CUS-1002", "CUS-1001"])
  })

  it("keeps the given order between customers that compare equal", () => {
    // CUS-1002 and CUS-1001 both have 23 orders.
    expect(
      getIds({ sort: { column: "totalOrders", direction: "desc" } })
    ).toEqual(["CUS-1002", "CUS-1001", "CUS-1003", "CUS-1010"])
  })

  it("sorts by join date", () => {
    expect(getIds({ sort: { column: "joinedAt", direction: "desc" } })).toEqual([
      "CUS-1001",
      "CUS-1010",
      "CUS-1003",
      "CUS-1002",
    ])
  })

  it("sorts by status", () => {
    expect(getIds({ sort: { column: "status", direction: "asc" } })).toEqual([
      "CUS-1002",
      "CUS-1001",
      "CUS-1010",
      "CUS-1003",
    ])
  })

  it("does not change the customers it was given", () => {
    const before = customers.map((customer) => customer.id)

    queryCustomers(customers, query({ sort: { column: "id", direction: "asc" } }))

    expect(customers.map((customer) => customer.id)).toEqual(before)
  })
})

describe("queryCustomers paging", () => {
  const many = Array.from({ length: 25 }, (_, index) =>
    createCustomer({ id: `CUS-${2000 + index}`, name: `Customer ${index}` })
  )

  it("returns one page of rows and the total across all pages", () => {
    const result = queryCustomers(many, query({ page: 2, pageSize: 10 }))

    expect(result.customers.map((customer) => customer.id)).toEqual(
      many.slice(10, 20).map((customer) => customer.id)
    )
    expect(result.totalRecords).toBe(25)
    expect(result.page).toBe(2)
  })

  it("returns a short last page", () => {
    const result = queryCustomers(many, query({ page: 3, pageSize: 10 }))

    expect(result.customers).toHaveLength(5)
  })

  it("pages after filtering, so the total follows the filter", () => {
    const result = queryCustomers(many, query({ search: "customer 1" }))

    // "Customer 1" and "Customer 10" to "Customer 19".
    expect(result.totalRecords).toBe(11)
    expect(result.customers).toHaveLength(10)
  })

  it("falls back to the last page when the asked-for page no longer exists", () => {
    const result = queryCustomers(many, query({ page: 3, pageSize: 10, search: "customer 1" }))

    expect(result.page).toBe(2)
    expect(result.customers).toHaveLength(1)
  })
})
