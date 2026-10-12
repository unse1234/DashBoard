import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { customerKeys } from "@/hooks/customers/customer.keys"
import {
  getOrder,
  listOrders,
  markOrderPaid,
  updateOrderStatus,
} from "@/services/orders/order.api"
import { orderKeys } from "@/hooks/orders/order.keys"
import {
  useMarkOrderPaidMutation,
  useUpdateOrderStatusMutation,
} from "@/hooks/orders/order.mutations"
import { useOrderQuery, useOrdersQuery } from "@/hooks/orders/order.queries"
import { defaultOrdersQuery } from "@/lib/orders/order.query"
import { productKeys } from "@/hooks/products/product.keys"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createOrder, createOrderListItem } from "@/test-utils/order-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"

vi.mock("@/services/orders/order.api")
vi.mock("@/hooks/use-auth")

const pending = createOrder({ status: "pending", paymentStatus: "pending" })

/** A mounted list and details next to a mutation, so tests can see what refetches. */
function renderWithReaders<T>(useMutationUnderTest: () => T) {
  const queryClient = createTestQueryClient()
  // Entries of other modules that an order change must leave stale.
  queryClient.setQueryData(customerKeys.detail("CUS-1001"), { customer: {} })
  queryClient.setQueryData(productKeys.detail("PRD-2063"), { id: "PRD-2063" })
  const rendered = renderHook(
    () => ({
      list: useOrdersQuery(defaultOrdersQuery),
      detail: useOrderQuery("ORD-10001"),
      mutation: useMutationUnderTest(),
    }),
    { wrapper: createQueryWrapper(queryClient) }
  )
  return { queryClient, ...rendered }
}

async function readersLoaded(result: {
  current: { list: { isSuccess: boolean }; detail: { isSuccess: boolean } }
}) {
  await waitFor(() => {
    expect(result.current.list.isSuccess).toBe(true)
    expect(result.current.detail.isSuccess).toBe(true)
  })
  expect(listOrders).toHaveBeenCalledTimes(1)
}

const isStale = (
  queryClient: ReturnType<typeof createTestQueryClient>,
  key: readonly unknown[]
) => queryClient.getQueryState(key)?.isInvalidated === true

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(listOrders).mockResolvedValue({
    orders: [
      createOrderListItem({ status: "pending", paymentStatus: "pending" }),
    ],
    totalRecords: 1,
  })
  vi.mocked(getOrder).mockResolvedValue(pending)
})

describe("useUpdateOrderStatusMutation", () => {
  it("replaces the order's details with what the API returned, and refreshes the lists", async () => {
    const processing = { ...pending, status: "processing" as const }
    vi.mocked(updateOrderStatus).mockResolvedValue(processing)
    const { result, queryClient } = renderWithReaders(
      useUpdateOrderStatusMutation
    )
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        orderId: "ORD-10001",
        status: "processing",
      })
    )

    expect(updateOrderStatus).toHaveBeenCalledWith("ORD-10001", "processing")
    expect(queryClient.getQueryData(orderKeys.detail("ORD-10001"))).toEqual(
      processing
    )
    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(2))
    // The details came back in the response, so they are not fetched again.
    expect(getOrder).toHaveBeenCalledTimes(1)
  })

  it("marks the customers stale, since their statistics and recent orders count it", async () => {
    vi.mocked(updateOrderStatus).mockResolvedValue({
      ...pending,
      status: "processing",
    })
    const { result, queryClient } = renderWithReaders(
      useUpdateOrderStatusMutation
    )
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        orderId: "ORD-10001",
        status: "processing",
      })
    )

    expect(isStale(queryClient, customerKeys.detail("CUS-1001"))).toBe(true)
  })

  it("leaves the products alone unless the order was cancelled", async () => {
    vi.mocked(updateOrderStatus).mockResolvedValue({
      ...pending,
      status: "shipped",
      paymentStatus: "paid",
    })
    const { result, queryClient } = renderWithReaders(
      useUpdateOrderStatusMutation
    )
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        orderId: "ORD-10001",
        status: "shipped",
      })
    )

    expect(isStale(queryClient, productKeys.detail("PRD-2063"))).toBe(false)
  })

  it("marks the products stale when an order is cancelled, since their stock came back", async () => {
    vi.mocked(updateOrderStatus).mockResolvedValue({
      ...pending,
      status: "cancelled",
    })
    const { result, queryClient } = renderWithReaders(
      useUpdateOrderStatusMutation
    )
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        orderId: "ORD-10001",
        status: "cancelled",
      })
    )

    expect(isStale(queryClient, productKeys.detail("PRD-2063"))).toBe(true)
  })

  it("changes nothing when the API refuses", async () => {
    vi.mocked(updateOrderStatus).mockRejectedValue(
      new ApiError(409, ["A shipped order can't be cancelled."])
    )
    const { result, queryClient } = renderWithReaders(
      useUpdateOrderStatusMutation
    )
    await readersLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync({
          orderId: "ORD-10001",
          status: "cancelled",
        })
      ).rejects.toMatchObject({ status: 409 })
    })

    expect(queryClient.getQueryData(orderKeys.detail("ORD-10001"))).toEqual(
      pending
    )
    expect(listOrders).toHaveBeenCalledTimes(1)
    expect(isStale(queryClient, customerKeys.detail("CUS-1001"))).toBe(false)
    expect(isStale(queryClient, productKeys.detail("PRD-2063"))).toBe(false)
  })
})

describe("useMarkOrderPaidMutation", () => {
  it("replaces the order's details and refreshes the lists, leaving customers and products", async () => {
    const paid = { ...pending, paymentStatus: "paid" as const }
    vi.mocked(markOrderPaid).mockResolvedValue(paid)
    const { result, queryClient } = renderWithReaders(useMarkOrderPaidMutation)
    await readersLoaded(result)

    await act(() => result.current.mutation.mutateAsync("ORD-10001"))

    expect(markOrderPaid).toHaveBeenCalledWith("ORD-10001")
    expect(queryClient.getQueryData(orderKeys.detail("ORD-10001"))).toEqual(
      paid
    )
    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(2))
    expect(isStale(queryClient, customerKeys.detail("CUS-1001"))).toBe(false)
    expect(isStale(queryClient, productKeys.detail("PRD-2063"))).toBe(false)
  })

  it("changes nothing when the API refuses", async () => {
    vi.mocked(markOrderPaid).mockRejectedValue(
      new ApiError(409, ["A cancelled order can't be marked as paid."])
    )
    const { result, queryClient } = renderWithReaders(useMarkOrderPaidMutation)
    await readersLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync("ORD-10001")
      ).rejects.toMatchObject({ status: 409 })
    })

    expect(queryClient.getQueryData(orderKeys.detail("ORD-10001"))).toEqual(
      pending
    )
    expect(listOrders).toHaveBeenCalledTimes(1)
  })
})
