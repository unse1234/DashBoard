import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { attachSessionHandlers } from "@/lib/api/axios"
import {
  archiveProducts,
  buildProductsSearchParams,
  createProduct as createProductRequest,
  getProduct,
  getProductHistory,
  listCategories,
  listProducts,
  toProduct,
  updateProduct,
} from "@/services/products/product.api"
import { defaultProductsQuery } from "@/lib/products/product.query"
import type { ProductFormValues } from "@/types/product.types";
import { mockApi } from "@/test-utils/mock-api"
import {
  categoryFixtures,
  createHistoryEntry,
  createProduct,
} from "@/test-utils/product-fixtures"

const values: ProductFormValues = {
  name: "Studio Monitor",
  sku: "ELC-MON-27",
  brand: null,
  description: null,
  categoryId: "cat-electronics",
  status: "active",
  price: 349.99,
  costPrice: null,
  stock: 12,
}

/** What the API sends for a product: the UI's, with the status as stored. */
function apiProduct(overrides: Record<string, unknown> = {}) {
  return { ...createProduct(), status: "ACTIVE", ...overrides }
}

describe("buildProductsSearchParams", () => {
  it("always sends the page and page size, and nothing else by default", () => {
    expect(buildProductsSearchParams(defaultProductsQuery).toString()).toBe(
      "page=1&pageSize=10"
    )
  })

  it("adds a trimmed search, the category id and the status", () => {
    const params = buildProductsSearchParams({
      search: "  mug & cup ",
      category: "cat-home",
      status: "inactive",
      page: 3,
      pageSize: 50,
    })

    expect(params.get("search")).toBe("mug & cup")
    expect(params.get("categoryId")).toBe("cat-home")
    expect(params.get("status")).toBe("INACTIVE")
    expect(params.get("page")).toBe("3")
    expect(params.get("pageSize")).toBe("50")
    // The ampersand is encoded, not treated as a separator.
    expect(params.toString()).toContain("search=mug+%26+cup")
  })

  it("omits a blank search and the 'all' filters", () => {
    const params = buildProductsSearchParams({
      ...defaultProductsQuery,
      search: "   ",
    })

    expect(params.has("search")).toBe(false)
    expect(params.has("categoryId")).toBe(false)
    expect(params.has("status")).toBe(false)
  })

  it.each([
    ["active", "ACTIVE"],
    ["inactive", "INACTIVE"],
    ["out-of-stock", "OUT_OF_STOCK"],
  ] as const)("sends the %s filter as %s", (status, apiStatus) => {
    const params = buildProductsSearchParams({
      ...defaultProductsQuery,
      status,
    })

    expect(params.get("status")).toBe(apiStatus)
  })
})

describe("toProduct", () => {
  it.each([
    ["ACTIVE", "active"],
    ["INACTIVE", "inactive"],
  ] as const)(
    "maps the status %s to %s and keeps the rest",
    (apiStatus, status) => {
      const product = createProduct()

      expect(toProduct(apiProduct({ status: apiStatus }) as never)).toEqual({
        ...product,
        status,
      })
    }
  )
})

describe("products API calls", () => {
  let api: ReturnType<typeof mockApi>

  beforeEach(() => {
    attachSessionHandlers({
      getAccessToken: vi.fn().mockResolvedValue("token-1"),
      refreshSession: vi.fn().mockResolvedValue(false),
      clearSession: vi.fn(),
    })
  })

  afterEach(() => {
    api.restore()
  })

  it("lists a page of products with the total, as an authenticated GET", async () => {
    api = mockApi(() => ({
      data: {
        data: [
          apiProduct({ id: "PRD-1" }),
          apiProduct({ id: "PRD-2", status: "INACTIVE" }),
        ],
        meta: { page: 1, pageSize: 10, total: 42, totalPages: 5 },
      },
    }))
    const signal = new AbortController().signal

    const page = await listProducts(
      { ...defaultProductsQuery, search: "mug" },
      signal
    )

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/products",
      headers: { authorization: "Bearer token-1" },
      signal,
    })
    expect(String(api.requests[0].params)).toBe("page=1&pageSize=10&search=mug")
    expect(page.totalRecords).toBe(42)
    expect(page.products.map((p) => [p.id, p.status])).toEqual([
      ["PRD-1", "active"],
      ["PRD-2", "inactive"],
    ])
  })

  it("loads one product, encoding its id into the path", async () => {
    api = mockApi(() => ({ data: apiProduct() }))

    const product = await getProduct("PRD-1001")

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/products/PRD-1001",
    })
    expect(product).toEqual(createProduct())

    await getProduct("a/b")
    expect(api.requests[1].url).toBe("/products/a%2Fb")
  })

  it("loads a product's history", async () => {
    const entries = [createHistoryEntry(), createHistoryEntry({ id: "evt-2" })]
    api = mockApi(() => ({ data: { data: entries } }))

    await expect(getProductHistory("PRD-1001")).resolves.toEqual(entries)

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/products/PRD-1001/history",
    })
  })

  it("loads the categories", async () => {
    api = mockApi(() => ({ data: { data: categoryFixtures } }))

    await expect(listCategories()).resolves.toEqual(categoryFixtures)

    expect(api.requests[0]).toMatchObject({ method: "GET", url: "/categories" })
  })

  it("creates a product from the form's values, with the status in the API's spelling", async () => {
    api = mockApi(() => ({
      status: 201,
      data: apiProduct({ id: "PRD-1500", name: "Studio Monitor" }),
    }))

    const product = await createProductRequest(values)

    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/products",
      body: { ...values, status: "ACTIVE" },
    })
    expect(product).toMatchObject({ id: "PRD-1500", status: "active" })
  })

  it("saves an edit on top of the version it was made from", async () => {
    api = mockApi(() => ({ data: apiProduct({ version: 4 }) }))

    const product = await updateProduct("PRD-1001", 3, {
      ...values,
      status: "inactive",
      brand: "Soundcraft",
    })

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/products/PRD-1001",
      body: {
        version: 3,
        ...values,
        status: "INACTIVE",
        brand: "Soundcraft",
      },
    })
    expect(product.version).toBe(4)
  })

  it("archives products and resolves to how many it archived", async () => {
    api = mockApi(() => ({ data: { archived: 2 } }))

    await expect(archiveProducts(["PRD-1", "PRD-2"])).resolves.toBe(2)

    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/products/archive",
      body: { productIds: ["PRD-1", "PRD-2"] },
    })
  })

  it("lets the API's errors through as ApiError", async () => {
    api = mockApi(() => ({
      status: 409,
      data: { message: "A product with this SKU already exists" },
    }))

    await expect(createProductRequest(values)).rejects.toMatchObject({
      status: 409,
      message: "A product with this SKU already exists",
    })
    await expect(createProductRequest(values)).rejects.toBeInstanceOf(ApiError)
  })
})
