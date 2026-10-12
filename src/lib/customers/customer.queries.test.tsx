import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { getCustomerDetails, listCustomers } from "@/lib/customers/customer.api";
import { type CustomerPage } from "@/types/customer.types";
import {
  useCustomerDetailsQuery,
  useCustomersQuery,
} from "@/lib/customers/customer.queries"
import { defaultCustomersQuery } from "@/lib/customers/customer.query"
import { shouldRetryQuery } from "@/lib/query/query-client"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createCustomer,
  createCustomerDetails,
} from "@/test-utils/customer-fixtures"
import { createQueryWrapper } from "@/test-utils/render"

vi.mock("@/lib/customers/customer.api")
vi.mock("@/hooks/use-auth")

const details = createCustomerDetails()

function page(...names: string[]): CustomerPage {
  return {
    customers: names.map((name) => createCustomer({ id: name, name })),
    totalRecords: 30,
  }
}

function signedIn() {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  signedIn()
})

describe("useCustomersQuery", () => {
  it("loads the requested page with the request's abort signal", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page("Ada"))

    const { result } = renderHook(
      () => useCustomersQuery(defaultCustomersQuery),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalRecords).toBe(30)
    expect(listCustomers).toHaveBeenCalledWith(
      defaultCustomersQuery,
      expect.any(AbortSignal)
    )
  })

  it.each(["loading", "unauthenticated"] as const)(
    "stays idle while the session is %s",
    (status) => {
      vi.mocked(useAuth).mockReturnValue({ status, user: null })

      const { result } = renderHook(
        () => useCustomersQuery(defaultCustomersQuery),
        { wrapper: createQueryWrapper() }
      )

      expect(result.current.fetchStatus).toBe("idle")
      expect(listCustomers).not.toHaveBeenCalled()
    }
  )

  it("keeps showing the previous page while the next one loads", async () => {
    let resolveSecond: (value: CustomerPage) => void = () => {}
    vi.mocked(listCustomers)
      .mockResolvedValueOnce(page("First"))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    const { result, rerender } = renderHook(
      ({ pageNumber }) =>
        useCustomersQuery({ ...defaultCustomersQuery, page: pageNumber }),
      { wrapper: createQueryWrapper(), initialProps: { pageNumber: 1 } }
    )
    await waitFor(() =>
      expect(result.current.data?.customers[0].name).toBe("First")
    )

    rerender({ pageNumber: 2 })

    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.customers[0].name).toBe("First")
    resolveSecond(page("Second"))
    await waitFor(() =>
      expect(result.current.data?.customers[0].name).toBe("Second")
    )
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it("asks again when the sort changes", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page("Ada"))
    const { result, rerender } = renderHook(
      ({ sort }) => useCustomersQuery({ ...defaultCustomersQuery, sort }),
      {
        wrapper: createQueryWrapper(),
        initialProps: {
          sort: null as (typeof defaultCustomersQuery)["sort"],
        },
      }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ sort: { column: "totalSpent", direction: "desc" } })

    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2))
    expect(vi.mocked(listCustomers).mock.calls[1][0].sort).toEqual({
      column: "totalSpent",
      direction: "desc",
    })
  })

  it("treats searches that differ only by surrounding spaces as one request", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page("Ada"))
    const { result, rerender } = renderHook(
      ({ search }) => useCustomersQuery({ ...defaultCustomersQuery, search }),
      { wrapper: createQueryWrapper(), initialProps: { search: "ada" } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ search: "  ada " })

    expect(listCustomers).toHaveBeenCalledTimes(1)
    expect(vi.mocked(listCustomers).mock.calls[0][0].search).toBe("ada")
  })

  it("serves repeated visits to the same page from the cache while it is fresh", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page("Ada"))
    const wrapper = createQueryWrapper()

    const first = renderHook(() => useCustomersQuery(defaultCustomersQuery), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()
    const second = renderHook(() => useCustomersQuery(defaultCustomersQuery), {
      wrapper,
    })

    expect(second.result.current.data?.customers[0].name).toBe("Ada")
    expect(listCustomers).toHaveBeenCalledTimes(1)
  })
})

describe("useCustomerDetailsQuery", () => {
  it("loads one customer's details by id", async () => {
    vi.mocked(getCustomerDetails).mockResolvedValue(details)

    const { result } = renderHook(() => useCustomerDetailsQuery("CUS-1001"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toEqual(details))
    expect(getCustomerDetails).toHaveBeenCalledWith(
      "CUS-1001",
      expect.any(AbortSignal)
    )
  })

  it("keeps each customer's data apart", async () => {
    vi.mocked(getCustomerDetails).mockResolvedValue(details)
    const { result, rerender } = renderHook(
      ({ customerId }) => useCustomerDetailsQuery(customerId),
      {
        wrapper: createQueryWrapper(),
        initialProps: { customerId: "CUS-1001" },
      }
    )
    await waitFor(() => expect(result.current.data).toEqual(details))

    rerender({ customerId: "CUS-1002" })

    // No leftover from the previous customer while the next one loads.
    expect(result.current.data).toBeUndefined()
  })

  it("stays idle until the session is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    const { result } = renderHook(() => useCustomerDetailsQuery("CUS-1001"), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(getCustomerDetails).not.toHaveBeenCalled()
  })

  describe("with the app's retry policy", () => {
    function clientWithAppRetryPolicy() {
      return new QueryClient({
        defaultOptions: {
          queries: { retry: shouldRetryQuery, retryDelay: 1 },
        },
      })
    }

    it.each([400, 404])(
      "asks only once when the API answers %i",
      async (status) => {
        vi.mocked(getCustomerDetails).mockRejectedValue(
          new ApiError(status, ["Customer not found"])
        )

        const { result } = renderHook(() => useCustomerDetailsQuery("CUS-9"), {
          wrapper: createQueryWrapper(clientWithAppRetryPolicy()),
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(getCustomerDetails).toHaveBeenCalledTimes(1)
      }
    )
  })
})
