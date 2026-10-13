import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { attachSessionHandlers } from "@/lib/api/axios"
import {
  buildCustomersSearchParams,
  getCustomerDetails,
  listCustomers,
  toCustomerAddress,
  toCustomerOrderSummary,
} from "@/services/customers/customer.api"
import { defaultCustomersQuery } from "@/screens/customers/customer.filters"
import {
  createCustomer,
  createCustomerAddress,
  createCustomerOrder,
} from "@/test-utils/customer-fixtures"
import { mockApi } from "@/test-utils/mock-api"

describe("buildCustomersSearchParams", () => {
  it("always sends the page and page size, and nothing else by default", () => {
    expect(buildCustomersSearchParams(defaultCustomersQuery).toString()).toBe(
      "page=1&pageSize=10"
    )
  })

  it("adds a trimmed search and maps the sort to sortBy and sortOrder", () => {
    const params = buildCustomersSearchParams({
      ...defaultCustomersQuery,
      search: "  ada & co ",
      sort: { column: "totalSpent", direction: "desc" },
      page: 3,
      pageSize: 50,
    })

    expect(params.get("search")).toBe("ada & co")
    expect(params.get("sortBy")).toBe("totalSpent")
    expect(params.get("sortOrder")).toBe("desc")
    expect(params.get("page")).toBe("3")
    expect(params.get("pageSize")).toBe("50")
    // The ampersand is encoded, not treated as a separator.
    expect(params.toString()).toContain("search=ada+%26+co")
  })

  it("omits a blank search", () => {
    const params = buildCustomersSearchParams({
      ...defaultCustomersQuery,
      search: "   ",
    })

    expect(params.has("search")).toBe(false)
  })
})

describe("enum mapping", () => {
  it.each([
    ["SHIPPING", "shipping"],
    ["BILLING", "billing"],
  ] as const)("maps the address type %s to %s", (apiType, type) => {
    const address = createCustomerAddress()
    expect(toCustomerAddress({ ...address, type: apiType })).toEqual({
      ...address,
      type,
    })
  })

  it.each([
    ["PENDING", "pending"],
    ["PROCESSING", "processing"],
    ["SHIPPED", "shipped"],
    ["DELIVERED", "delivered"],
    ["CANCELLED", "cancelled"],
  ] as const)("maps the order status %s to %s", (apiStatus, status) => {
    const order = createCustomerOrder()
    expect(toCustomerOrderSummary({ ...order, status: apiStatus })).toEqual({
      ...order,
      status,
    })
  })
})

describe("customers API calls", () => {
  let api: ReturnType<typeof mockApi>

  beforeEach(() => {
    attachSessionHandlers({
      getAccessToken: () => "token-1",
      requestRefresh: vi.fn(),
      updateSession: vi.fn(),
      clearSession: vi.fn(),
    })
  })

  afterEach(() => {
    api.restore()
  })

  it("lists a page of customers with the total, as an authenticated GET", async () => {
    const customers = [
      createCustomer({ id: "CUS-1" }),
      createCustomer({ id: "CUS-2" }),
    ]
    api = mockApi(() => ({
      data: {
        data: customers,
        meta: { page: 1, pageSize: 10, total: 42, totalPages: 5 },
      },
    }))
    const signal = new AbortController().signal

    const page = await listCustomers(
      {
        ...defaultCustomersQuery,
        sort: { column: "name", direction: "asc" },
      },
      signal
    )

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/customers",
      signal,
    })
    expect(String(api.requests[0].params)).toBe(
      "page=1&pageSize=10&sortBy=name&sortOrder=asc"
    )
    expect(api.requests[0].headers.authorization).toBe("Bearer token-1")
    expect(page).toEqual({ customers, totalRecords: 42 })
  })

  it("fetches a customer's details, encoding the id and mapping the enums", async () => {
    const customer = createCustomer({ id: "CUS-1001" })
    api = mockApi(() => ({
      data: {
        customer,
        addresses: [{ ...createCustomerAddress(), type: "BILLING" }],
        recentOrders: [{ ...createCustomerOrder(), status: "CANCELLED" }],
      },
    }))
    const signal = new AbortController().signal

    const details = await getCustomerDetails("CUS 1/0", signal)

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/customers/CUS%201%2F0",
      signal,
    })
    expect(details.customer).toEqual(customer)
    expect(details.addresses[0].type).toBe("billing")
    expect(details.recentOrders[0].status).toBe("cancelled")
  })

  it.each([400, 404, 500])(
    "rejects with the API's status and message on a %i",
    async (status) => {
      api = mockApi(() => ({
        status,
        data: { statusCode: status, message: "Customer not found" },
      }))

      const failure = getCustomerDetails("CUS-1")

      await expect(failure).rejects.toBeInstanceOf(ApiError)
      await expect(failure).rejects.toMatchObject({
        status,
        messages: ["Customer not found"],
      })
    }
  )
})
