import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  archiveProducts,
  createProduct as createProductRequest,
  getProduct,
  getProductHistory,
  listProducts,
  updateProduct,
} from "@/services/products/product.api"
import { productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import {
  useArchiveProductsMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/hooks/products/product.mutations"
import {
  useProductHistoryQuery,
  useProductQuery,
  useProductsQuery,
} from "@/hooks/products/product.queries"
import { defaultProductsQuery } from "@/screens/products/product.filters"
import type { ProductFormValues } from "@/types/product.types"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createHistoryEntry,
  createProduct,
} from "@/test-utils/product-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"

vi.mock("@/services/products/product.api")
vi.mock("@/hooks/auth/use-auth")

const mug = createProduct({ id: "PRD-1001", name: "Mug" })
const values: ProductFormValues = {
  name: "Mug",
  sku: "MUG-1",
  subtitle: null,
  brand: null,
  description: null,
  imageUrl: null,
  galleryUrls: [],
  categoryId: "cat-home",
  status: "active",
  price: 10,
  costPrice: null,
  stock: 3,
}

/** A mounted list, details and history next to a mutation, so tests can see what refetches. */
function renderWithReaders<T>(useMutationUnderTest: () => T) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(catalogKeys.lists(), { data: [], total: 0 })
  queryClient.setQueryData(catalogKeys.detail("PRD-1001"), mug)
  const rendered = renderHook(
    () => ({
      list: useProductsQuery(defaultProductsQuery),
      detail: useProductQuery("PRD-1001"),
      history: useProductHistoryQuery("PRD-1001"),
      mutation: useMutationUnderTest(),
    }),
    { wrapper: createQueryWrapper(queryClient) }
  )
  return { queryClient, ...rendered }
}

async function readersLoaded(result: {
  current: {
    list: { isSuccess: boolean }
    detail: { isSuccess: boolean }
    history: { isSuccess: boolean }
  }
}) {
  await waitFor(() => {
    expect(result.current.list.isSuccess).toBe(true)
    expect(result.current.detail.isSuccess).toBe(true)
    expect(result.current.history.isSuccess).toBe(true)
  })
  expect(listProducts).toHaveBeenCalledTimes(1)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(listProducts).mockResolvedValue({
    products: [mug],
    totalRecords: 1,
  })
  vi.mocked(getProduct).mockResolvedValue(mug)
  vi.mocked(getProductHistory).mockResolvedValue([createHistoryEntry()])
})

describe("useCreateProductMutation", () => {
  it("refreshes the lists and caches the new product's details", async () => {
    const created = createProduct({ id: "PRD-1500", name: "New" })
    vi.mocked(createProductRequest).mockResolvedValue(created)
    const { result, queryClient } = renderWithReaders(useCreateProductMutation)
    await readersLoaded(result)

    await act(() => result.current.mutation.mutateAsync(values))

    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2))
    expect(queryClient.getQueryData(productKeys.detail("PRD-1500"))).toEqual(
      created
    )
    expect(queryClient.getQueryState(catalogKeys.lists())?.isInvalidated).toBe(
      true
    )
    expect(
      queryClient.getQueryState(catalogKeys.detail("PRD-1001"))?.isInvalidated
    ).toBe(true)
  })

  it("leaves the list alone when creating fails", async () => {
    vi.mocked(createProductRequest).mockRejectedValue(
      new ApiError(409, ["A product with this SKU already exists"])
    )
    const { result, queryClient } = renderWithReaders(useCreateProductMutation)
    await readersLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync(values)
      ).rejects.toBeInstanceOf(ApiError)
    })

    expect(listProducts).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryState(catalogKeys.lists())?.isInvalidated).toBe(
      false
    )
  })
})

describe("useUpdateProductMutation", () => {
  it("sends the version it was given and replaces the product's details", async () => {
    const saved = createProduct({ id: "PRD-1001", name: "Mug", version: 2 })
    vi.mocked(updateProduct).mockResolvedValue(saved)
    const { result, queryClient } = renderWithReaders(useUpdateProductMutation)
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        productId: "PRD-1001",
        version: 1,
        values,
      })
    )

    expect(updateProduct).toHaveBeenCalledWith("PRD-1001", 1, values)
    expect(queryClient.getQueryData(productKeys.detail("PRD-1001"))).toEqual(
      saved
    )
    expect(queryClient.getQueryState(catalogKeys.lists())?.isInvalidated).toBe(
      true
    )
    expect(
      queryClient.getQueryState(catalogKeys.detail("PRD-1001"))?.isInvalidated
    ).toBe(true)
  })

  it("refreshes the lists and the product's history, not its details", async () => {
    vi.mocked(updateProduct).mockResolvedValue(
      createProduct({ id: "PRD-1001", version: 2 })
    )
    const { result } = renderWithReaders(useUpdateProductMutation)
    await readersLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        productId: "PRD-1001",
        version: 1,
        values,
      })
    )

    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(getProductHistory).toHaveBeenCalledTimes(2))
    // The details came back in the response, so they are not fetched again.
    expect(getProduct).toHaveBeenCalledTimes(1)
  })

  it("keeps the cached details when the product changed in the meantime", async () => {
    vi.mocked(updateProduct).mockRejectedValue(
      new ApiError(409, ["This product was changed by someone else."])
    )
    const { result, queryClient } = renderWithReaders(useUpdateProductMutation)
    await readersLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync({
          productId: "PRD-1001",
          version: 1,
          values,
        })
      ).rejects.toMatchObject({ status: 409 })
    })

    expect(queryClient.getQueryData(productKeys.detail("PRD-1001"))).toEqual(
      mug
    )
    expect(listProducts).toHaveBeenCalledTimes(1)
  })
})

describe("useArchiveProductsMutation", () => {
  it("forgets the archived products and refreshes the lists", async () => {
    vi.mocked(archiveProducts).mockResolvedValue(1)
    const { result, queryClient } = renderWithReaders(
      useArchiveProductsMutation
    )
    await readersLoaded(result)
    // Cached from an earlier visit; no screen is showing them now.
    queryClient.setQueryData(productKeys.detail("PRD-2000"), mug)
    queryClient.setQueryData(productKeys.history("PRD-2000"), [])

    await act(() => result.current.mutation.mutateAsync(["PRD-2000"]))

    expect(archiveProducts).toHaveBeenCalledWith(["PRD-2000"])
    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2))
    // Nothing is left to show for it: a later visit asks the API and gets 404.
    expect(
      queryClient.getQueryData(productKeys.detail("PRD-2000"))
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(productKeys.history("PRD-2000"))
    ).toBeUndefined()
    expect(queryClient.getQueryState(catalogKeys.lists())?.isInvalidated).toBe(
      true
    )
  })

  it("leaves everything alone when it fails", async () => {
    vi.mocked(archiveProducts).mockRejectedValue(
      new ApiError(403, ["Insufficient permissions"])
    )
    const { result, queryClient } = renderWithReaders(
      useArchiveProductsMutation
    )
    await readersLoaded(result)
    queryClient.setQueryData(productKeys.detail("PRD-2000"), mug)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync(["PRD-2000"])
      ).rejects.toMatchObject({ status: 403 })
    })

    expect(listProducts).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(productKeys.detail("PRD-2000"))).toEqual(
      mug
    )
  })
})
