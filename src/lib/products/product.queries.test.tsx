import { renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  getProduct,
  getProductHistory,
  listCategories,
  listProducts,
  type ProductPage,
} from "@/lib/products/product.api"
import {
  useCategoriesQuery,
  useProductHistoryQuery,
  useProductQuery,
  useProductsQuery,
} from "@/lib/products/product.queries"
import { defaultProductsQuery } from "@/lib/products/product.query"
import { shouldRetryQuery } from "@/lib/query/query-client"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  categoryFixtures,
  createHistoryEntry,
  createProduct,
} from "@/test-utils/product-fixtures"
import { createQueryWrapper } from "@/test-utils/render"

vi.mock("@/lib/products/product.api")
vi.mock("@/hooks/use-auth")

function page(...names: string[]): ProductPage {
  return {
    products: names.map((name) => createProduct({ id: name, name })),
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

describe("useProductsQuery", () => {
  it("loads the requested page with the request's abort signal", async () => {
    vi.mocked(listProducts).mockResolvedValue(page("Mug"))

    const { result } = renderHook(
      () => useProductsQuery(defaultProductsQuery),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalRecords).toBe(30)
    expect(listProducts).toHaveBeenCalledWith(
      defaultProductsQuery,
      expect.any(AbortSignal)
    )
  })

  it.each(["loading", "unauthenticated"] as const)(
    "stays idle while the session is %s",
    (status) => {
      vi.mocked(useAuth).mockReturnValue({ status, user: null })

      const { result } = renderHook(
        () => useProductsQuery(defaultProductsQuery),
        { wrapper: createQueryWrapper() }
      )

      expect(result.current.fetchStatus).toBe("idle")
      expect(listProducts).not.toHaveBeenCalled()
    }
  )

  it("keeps showing the previous page while the next one loads", async () => {
    let resolveSecond: (value: ProductPage) => void = () => {}
    vi.mocked(listProducts)
      .mockResolvedValueOnce(page("First"))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    const { result, rerender } = renderHook(
      ({ pageNumber }) =>
        useProductsQuery({ ...defaultProductsQuery, page: pageNumber }),
      { wrapper: createQueryWrapper(), initialProps: { pageNumber: 1 } }
    )
    await waitFor(() =>
      expect(result.current.data?.products[0].name).toBe("First")
    )

    rerender({ pageNumber: 2 })

    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.products[0].name).toBe("First")
    resolveSecond(page("Second"))
    await waitFor(() =>
      expect(result.current.data?.products[0].name).toBe("Second")
    )
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it("asks again when a filter changes", async () => {
    vi.mocked(listProducts).mockResolvedValue(page("Mug"))
    const { result, rerender } = renderHook(
      ({ status }) => useProductsQuery({ ...defaultProductsQuery, status }),
      {
        wrapper: createQueryWrapper(),
        initialProps: { status: "all" as "all" | "out-of-stock" },
      }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ status: "out-of-stock" })

    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2))
    expect(vi.mocked(listProducts).mock.calls[1][0].status).toBe("out-of-stock")
  })

  it("treats searches that differ only by surrounding spaces as one request", async () => {
    vi.mocked(listProducts).mockResolvedValue(page("Mug"))
    const { result, rerender } = renderHook(
      ({ search }) => useProductsQuery({ ...defaultProductsQuery, search }),
      { wrapper: createQueryWrapper(), initialProps: { search: "mug" } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ search: "  mug " })

    expect(listProducts).toHaveBeenCalledTimes(1)
    expect(vi.mocked(listProducts).mock.calls[0][0].search).toBe("mug")
  })
})

describe("useProductQuery", () => {
  it("loads one product", async () => {
    vi.mocked(getProduct).mockResolvedValue(createProduct())

    const { result } = renderHook(() => useProductQuery("PRD-1001"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getProduct).toHaveBeenCalledWith("PRD-1001", expect.any(AbortSignal))
    expect(result.current.data?.id).toBe("PRD-1001")
  })

  it("does not retry a 404, which is the API's answer", () => {
    expect(shouldRetryQuery(0, new ApiError(404, ["Product not found"]))).toBe(
      false
    )
  })

  it("stays idle until the session is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    const { result } = renderHook(() => useProductQuery("PRD-1001"), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(getProduct).not.toHaveBeenCalled()
  })
})

describe("useProductHistoryQuery", () => {
  it("loads the history of one product", async () => {
    vi.mocked(getProductHistory).mockResolvedValue([createHistoryEntry()])

    const { result } = renderHook(() => useProductHistoryQuery("PRD-1001"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getProductHistory).toHaveBeenCalledWith(
      "PRD-1001",
      expect.any(AbortSignal)
    )
    expect(result.current.data).toHaveLength(1)
  })
})

describe("useCategoriesQuery", () => {
  it("loads the categories once for several readers", async () => {
    vi.mocked(listCategories).mockResolvedValue(categoryFixtures)
    const wrapper = createQueryWrapper()

    const first = renderHook(() => useCategoriesQuery(), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    const second = renderHook(() => useCategoriesQuery(), { wrapper })

    expect(second.result.current.data).toEqual(categoryFixtures)
    expect(listCategories).toHaveBeenCalledTimes(1)
  })
})
