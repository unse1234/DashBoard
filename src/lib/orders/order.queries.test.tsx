import { renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { getOrder, listOrders } from "@/lib/orders/order.api";
import { type OrderPage } from "@/types/order.types";
import { useOrderQuery, useOrdersQuery } from "@/lib/orders/order.queries"
import { defaultOrdersQuery } from "@/lib/orders/order.query"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createOrder, createOrderListItem } from "@/test-utils/order-fixtures"
import { createQueryWrapper } from "@/test-utils/render"

vi.mock("@/lib/orders/order.api")
vi.mock("@/hooks/use-auth")

function page(...ids: string[]): OrderPage {
  return {
    orders: ids.map((id) => createOrderListItem({ id })),
    totalRecords: 30,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
})

describe("useOrdersQuery", () => {
  it("loads the requested page with the request's abort signal", async () => {
    vi.mocked(listOrders).mockResolvedValue(page("ORD-1"))

    const { result } = renderHook(() => useOrdersQuery(defaultOrdersQuery), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalRecords).toBe(30)
    expect(listOrders).toHaveBeenCalledWith(
      defaultOrdersQuery,
      expect.any(AbortSignal)
    )
  })

  it.each(["loading", "unauthenticated"] as const)(
    "stays idle while the session is %s",
    (status) => {
      vi.mocked(useAuth).mockReturnValue({ status, user: null })

      const { result } = renderHook(() => useOrdersQuery(defaultOrdersQuery), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.fetchStatus).toBe("idle")
      expect(listOrders).not.toHaveBeenCalled()
    }
  )

  it("keeps showing the previous page while the next one loads", async () => {
    let resolveSecond: (value: OrderPage) => void = () => {}
    vi.mocked(listOrders)
      .mockResolvedValueOnce(page("ORD-FIRST"))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    const { result, rerender } = renderHook(
      ({ pageNumber }) =>
        useOrdersQuery({ ...defaultOrdersQuery, page: pageNumber }),
      { wrapper: createQueryWrapper(), initialProps: { pageNumber: 1 } }
    )
    await waitFor(() =>
      expect(result.current.data?.orders[0].id).toBe("ORD-FIRST")
    )

    rerender({ pageNumber: 2 })

    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.orders[0].id).toBe("ORD-FIRST")
    resolveSecond(page("ORD-SECOND"))
    await waitFor(() =>
      expect(result.current.data?.orders[0].id).toBe("ORD-SECOND")
    )
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it("asks again when the sort or a filter changes", async () => {
    vi.mocked(listOrders).mockResolvedValue(page("ORD-1"))
    const { result, rerender } = renderHook(
      ({ status }) => useOrdersQuery({ ...defaultOrdersQuery, status }),
      {
        wrapper: createQueryWrapper(),
        initialProps: { status: "all" as "all" | "shipped" },
      }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ status: "shipped" })

    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(2))
    expect(vi.mocked(listOrders).mock.calls[1][0].status).toBe("shipped")
  })

  it("treats searches that differ only by surrounding spaces as one request", async () => {
    vi.mocked(listOrders).mockResolvedValue(page("ORD-1"))
    const { result, rerender } = renderHook(
      ({ search }) => useOrdersQuery({ ...defaultOrdersQuery, search }),
      { wrapper: createQueryWrapper(), initialProps: { search: "ada" } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ search: "  ada " })

    expect(listOrders).toHaveBeenCalledTimes(1)
    expect(vi.mocked(listOrders).mock.calls[0][0].search).toBe("ada")
  })
})

describe("useOrderQuery", () => {
  it("loads one order", async () => {
    vi.mocked(getOrder).mockResolvedValue(createOrder())

    const { result } = renderHook(() => useOrderQuery("ORD-10001"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getOrder).toHaveBeenCalledWith("ORD-10001", expect.any(AbortSignal))
    expect(result.current.data?.id).toBe("ORD-10001")
  })

  it("stays idle until the session is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    const { result } = renderHook(() => useOrderQuery("ORD-10001"), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(getOrder).not.toHaveBeenCalled()
  })
})
