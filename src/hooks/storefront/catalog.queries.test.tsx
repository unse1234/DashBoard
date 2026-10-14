import { renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import {
  getStorefrontProduct,
  listStorefrontProducts,
} from "@/services/storefront/catalog.api"
import {
  useStorefrontProductQuery,
  useStorefrontProductsQuery,
} from "@/hooks/storefront/catalog.queries"
import { createQueryWrapper } from "@/test-utils/render"
import {
  createStorefrontPage,
  createStorefrontProduct,
} from "@/test-utils/storefront-fixtures"
import type { StorefrontProductsQuery } from "@/types/storefront/product.types"

vi.mock("@/services/storefront/catalog.api")

const defaults: StorefrontProductsQuery = {
  search: "",
  page: 1,
  pageSize: 24,
  sort: "newest",
}
const pageOf = (...names: string[]) =>
  createStorefrontPage(
    names.map((name) => createStorefrontProduct({ name })),
    { total: 30, totalPages: 2 }
  )

beforeEach(() => {
  vi.resetAllMocks()
})

describe("useStorefrontProductsQuery", () => {
  it("loads the requested page with the request's abort signal, with no session needed", async () => {
    vi.mocked(listStorefrontProducts).mockResolvedValue(pageOf("Kettle"))

    const { result } = renderHook(() => useStorefrontProductsQuery(defaults), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.meta.total).toBe(30)
    expect(listStorefrontProducts).toHaveBeenCalledWith(
      defaults,
      expect.any(AbortSignal)
    )
  })

  it("treats searches that differ only by surrounding spaces as one request", async () => {
    vi.mocked(listStorefrontProducts).mockResolvedValue(pageOf("Kettle"))
    const wrapper = createQueryWrapper()

    const first = renderHook(
      () => useStorefrontProductsQuery({ ...defaults, search: "kettle" }),
      { wrapper }
    )
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    const second = renderHook(
      () => useStorefrontProductsQuery({ ...defaults, search: "  kettle " }),
      { wrapper }
    )
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

    expect(listStorefrontProducts).toHaveBeenCalledTimes(1)
    expect(listStorefrontProducts).toHaveBeenCalledWith(
      { ...defaults, search: "kettle" },
      expect.any(AbortSignal)
    )
  })

  it("keeps showing the previous page while the next one loads", async () => {
    let resolveSecond: (value: ReturnType<typeof pageOf>) => void = () => {}
    vi.mocked(listStorefrontProducts)
      .mockResolvedValueOnce(pageOf("First"))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    const { result, rerender } = renderHook(
      ({ page }) => useStorefrontProductsQuery({ ...defaults, page }),
      { wrapper: createQueryWrapper(), initialProps: { page: 1 } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ page: 2 })

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true))
    expect(result.current.data?.products[0].name).toBe("First")

    resolveSecond(pageOf("Second"))
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false))
    expect(result.current.data?.products[0].name).toBe("Second")
  })

  it("does not repeat a request the API answered with a 4xx", async () => {
    vi.mocked(listStorefrontProducts).mockRejectedValue(
      new ApiError(400, ["bad query"])
    )

    const { result } = renderHook(() => useStorefrontProductsQuery(defaults), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(listStorefrontProducts).toHaveBeenCalledTimes(1)
  })
})

describe("useStorefrontProductQuery", () => {
  it("loads one product by id", async () => {
    const product = createStorefrontProduct({ name: "Kettle" })
    vi.mocked(getStorefrontProduct).mockResolvedValue(product)

    const { result } = renderHook(() => useStorefrontProductQuery("PRD-1"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(product)
    expect(getStorefrontProduct).toHaveBeenCalledWith(
      "PRD-1",
      expect.any(AbortSignal)
    )
  })

  it("surfaces a missing product as a 404 error", async () => {
    vi.mocked(getStorefrontProduct).mockRejectedValue(
      new ApiError(404, ["Product not found"])
    )

    const { result } = renderHook(() => useStorefrontProductQuery("PRD-9"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ status: 404 })
  })
})
