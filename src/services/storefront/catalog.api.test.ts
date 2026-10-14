import { ApiError } from "@/lib/api/api-error"
import {
  buildStorefrontProductsParams,
  getStorefrontProduct,
  listStorefrontProducts,
} from "@/services/storefront/catalog.api"
import { mockApi } from "@/test-utils/mock-api"
import {
  createStorefrontPage,
  createStorefrontProduct,
  toPageResponse,
} from "@/test-utils/storefront-fixtures"
import type { StorefrontProductsQuery } from "@/types/storefront/product.types"

const defaults: StorefrontProductsQuery = {
  search: "",
  page: 1,
  pageSize: 24,
  sort: "newest",
}

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

describe("buildStorefrontProductsParams", () => {
  it("always sends the page, the page size and the sort", () => {
    expect(buildStorefrontProductsParams(defaults).toString()).toBe(
      "page=1&pageSize=24&sort=newest"
    )
  })

  it("adds a trimmed search and the category", () => {
    const params = buildStorefrontProductsParams({
      ...defaults,
      search: "  mug & cup ",
      categoryId: "cat-1",
      sort: "price_desc",
      page: 3,
    })

    expect(params.get("search")).toBe("mug & cup")
    expect(params.get("categoryId")).toBe("cat-1")
    expect(params.get("sort")).toBe("price_desc")
    expect(params.get("page")).toBe("3")
    // The ampersand is encoded, not treated as a separator.
    expect(params.toString()).toContain("search=mug+%26+cup")
  })

  it("omits a blank search", () => {
    expect(
      buildStorefrontProductsParams({ ...defaults, search: "   " }).has(
        "search"
      )
    ).toBe(false)
  })
})

describe("listStorefrontProducts", () => {
  it("asks the public route, unauthenticated, and returns the page as sent", async () => {
    const page = createStorefrontPage(
      [createStorefrontProduct({ name: "Kettle", price: 199.99 })],
      { total: 31, totalPages: 2 }
    )
    api = mockApi(() => ({ data: toPageResponse(page) }))
    const controller = new AbortController()

    const result = await listStorefrontProducts(
      { ...defaults, search: "kettle" },
      controller.signal
    )

    expect(result).toEqual(page)
    const [request] = api.requests
    expect(request.method).toBe("GET")
    expect(request.url).toBe("/storefront/products")
    expect(String(request.params)).toBe(
      "page=1&pageSize=24&sort=newest&search=kettle"
    )
    expect(request.headers.authorization).toBeUndefined()
    expect(request.withCredentials).toBe(false)
    expect(request.signal).toBeDefined()
  })

  it("rejects with the API's error", async () => {
    api = mockApi(() => ({
      status: 400,
      data: {
        statusCode: 400,
        message: ["page must not be greater than 10000"],
      },
    }))

    await expect(listStorefrontProducts(defaults)).rejects.toMatchObject({
      status: 400,
    })
  })
})

describe("getStorefrontProduct", () => {
  it("fetches one product by its encoded public id", async () => {
    const product = createStorefrontProduct({ name: "Kettle" })
    api = mockApi(() => ({ data: product }))

    await expect(getStorefrontProduct("PRD-1001")).resolves.toEqual(product)
    expect(api.requests[0].url).toBe("/storefront/products/PRD-1001")
    expect(api.requests[0].headers.authorization).toBeUndefined()
  })

  it("encodes an id that is not a plain word", async () => {
    api = mockApi(() => ({ data: createStorefrontProduct() }))

    await getStorefrontProduct("a/b?c")

    expect(api.requests[0].url).toBe("/storefront/products/a%2Fb%3Fc")
  })

  it("rejects with a 404 ApiError for a product the shop does not show", async () => {
    api = mockApi(() => ({
      status: 404,
      data: { statusCode: 404, message: "Product not found" },
    }))

    const error = await getStorefrontProduct("PRD-9").catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404 })
  })
})
