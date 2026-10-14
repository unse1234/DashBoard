import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { BagPreview } from "@/components/storefront/layout/bag-preview"
import { BagProvider } from "@/providers/bag-provider"
import { CatalogBrowser } from "@/screens/storefront/catalog/components/catalog-browser"
import { mockApi, type RecordedRequest } from "@/test-utils/mock-api"
import { renderWithQuery } from "@/test-utils/render"
import {
  createStorefrontPage,
  createStorefrontProduct,
  toPageResponse,
} from "@/test-utils/storefront-fixtures"
import type { StorefrontProduct } from "@/types/storefront/product.types"

const watch = createStorefrontProduct({
  id: "PRD-1001",
  name: "Apple Watch",
  subtitle: "Series 5 SE",
  price: 52999,
})
const headphones = createStorefrontProduct({
  id: "PRD-1002",
  name: "Sony ZX330BT",
  subtitle: "Light Grey",
  price: 3999,
})
const phoneRed = createStorefrontProduct({
  id: "PRD-1003",
  name: "iPhone 11",
  subtitle: "Product RED",
  price: 61999,
})
const catalog = [watch, headphones, phoneRed]

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

const searchOf = (request: RecordedRequest) =>
  new URLSearchParams(String(request.params)).get("search")

/**
 * A stand-in for the server: it does the searching, as the real one does.
 * Matching name or subtitle, ignoring case, like the API.
 */
function serve(products: StorefrontProduct[] = catalog) {
  api = mockApi((request) => {
    const params = new URLSearchParams(String(request.params))
    const needle = (params.get("search") ?? "").toLowerCase()
    const matches = products.filter(
      (product) =>
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.subtitle?.toLowerCase().includes(needle)
    )
    return { data: toPageResponse(createStorefrontPage(matches)) }
  })
  return api
}

function renderCatalog() {
  return renderWithQuery(
    <BagProvider initialItems={[]}>
      <CatalogBrowser />
      <BagPreview />
    </BagProvider>
  )
}

const cards = () => screen.queryAllByRole("article")
const loaded = () => screen.findAllByRole("article")

function bagPreview() {
  return within(screen.getByRole("complementary", { name: "Bag" }))
}

describe("CatalogBrowser", () => {
  describe("loading", () => {
    it("asks the public route for the first page, newest first, with no token", async () => {
      const { requests } = serve()
      renderCatalog()
      await loaded()

      expect(requests).toHaveLength(1)
      expect(requests[0].url).toBe("/storefront/products")
      expect(String(requests[0].params)).toBe("page=1&pageSize=24&sort=newest")
      expect(requests[0].headers.authorization).toBeUndefined()
    })

    it("announces loading, then shows every product the server returned, in its order", async () => {
      serve()
      renderCatalog()
      expect(screen.getByText("Loading products")).toBeInTheDocument()

      await loaded()

      expect(
        cards().map((card) => within(card).getByRole("heading").textContent)
      ).toEqual(["Apple Watch", "Sony ZX330BT", "iPhone 11"])
      expect(screen.queryByText("Loading products")).not.toBeInTheDocument()
    })

    it("explains an empty catalog", async () => {
      serve([])
      renderCatalog()

      expect(
        await screen.findByText("There are no products to show yet.")
      ).toBeInTheDocument()
      expect(cards()).toHaveLength(0)
    })

    it("explains a failure and loads again on request", async () => {
      let fail = true
      api = mockApi(() =>
        fail
          ? { status: 500, data: { statusCode: 500, message: "boom" } }
          : { data: toPageResponse(createStorefrontPage(catalog)) }
      )
      renderCatalog()

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn’t load products."
      )

      fail = false
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))

      expect(await loaded()).toHaveLength(3)
    })
  })

  describe("search", () => {
    it("sends the search to the server instead of filtering in the browser", async () => {
      const { requests } = serve()
      renderCatalog()
      await loaded()

      await userEvent.type(screen.getByLabelText("Search Item"), "APPLE")

      await waitFor(() => expect(cards()).toHaveLength(1))
      expect(
        screen.getByRole("heading", { name: "Apple Watch" })
      ).toBeInTheDocument()
      // Typed letter by letter, yet asked for once it settled.
      const searches = requests.map(searchOf).filter(Boolean)
      expect(searches).toEqual(["APPLE"])
    })

    it("restores the catalog when the search is cleared, without waiting", async () => {
      serve()
      renderCatalog()
      await loaded()
      const search = screen.getByLabelText("Search Item")

      await userEvent.type(search, "sony")
      await waitFor(() => expect(cards()).toHaveLength(1))

      await userEvent.clear(search)
      await waitFor(() => expect(cards()).toHaveLength(3))
    })

    it("explains an empty result, announces it, and offers a way back", async () => {
      serve()
      renderCatalog()
      await loaded()
      const search = screen.getByLabelText("Search Item")

      await userEvent.type(search, "galaxy")

      expect(
        await screen.findByText("No products match “galaxy”.")
      ).toBeInTheDocument()
      expect(cards()).toHaveLength(0)
      expect(
        screen
          .getAllByRole("status")
          .some((status) => status.textContent === "0 products found")
      ).toBe(true)

      await userEvent.click(
        screen.getByRole("button", { name: "Clear search" })
      )

      expect(await loaded()).toHaveLength(3)
      expect(search).toHaveValue("")
      expect(search).toHaveFocus()
    })

    it("keeps the previous results on screen while the new search loads", async () => {
      let release: (() => void) | undefined
      api = mockApi((request) => {
        const search = searchOf(request)
        const data = toPageResponse(
          createStorefrontPage(search ? [watch] : catalog)
        )
        if (!search) return { data }
        return new Promise((resolve) => {
          release = () => resolve({ data })
        })
      })
      renderCatalog()
      await loaded()

      await userEvent.type(screen.getByLabelText("Search Item"), "apple")
      await waitFor(() => expect(release).toBeDefined())

      // Still the three: the grid never blanks while the server thinks.
      expect(cards()).toHaveLength(3)

      await act(async () => release?.())
      await waitFor(() => expect(cards()).toHaveLength(1))
    })
  })

  describe("paging", () => {
    function servePages() {
      api = mockApi((request) => {
        const page = Number(
          new URLSearchParams(String(request.params)).get("page")
        )
        const product = page === 1 ? watch : headphones
        return {
          data: toPageResponse(
            createStorefrontPage([product], {
              page,
              total: 48,
              totalPages: 2,
            })
          ),
        }
      })
      return api
    }

    it("shows no pager for a single page", async () => {
      serve()
      renderCatalog()
      await loaded()

      expect(
        screen.queryByRole("navigation", { name: "Catalog pages" })
      ).not.toBeInTheDocument()
    })

    it("pages through the server's pages, as its meta describes them", async () => {
      const { requests } = servePages()
      renderCatalog()
      await screen.findByRole("heading", { name: "Apple Watch" })

      const pager = within(
        screen.getByRole("navigation", { name: "Catalog pages" })
      )
      expect(pager.getByText("Page 1 of 2")).toBeInTheDocument()
      expect(pager.getByRole("button", { name: "Previous" })).toBeDisabled()

      await userEvent.click(pager.getByRole("button", { name: "Next" }))

      expect(
        await screen.findByRole("heading", { name: "Sony ZX330BT" })
      ).toBeInTheDocument()
      expect(pager.getByText("Page 2 of 2")).toBeInTheDocument()
      expect(pager.getByRole("button", { name: "Next" })).toBeDisabled()
      expect(
        requests.map((r) => new URLSearchParams(String(r.params)).get("page"))
      ).toEqual(["1", "2"])
    })

    it("starts again at page 1 for a new search", async () => {
      const { requests } = servePages()
      renderCatalog()
      await screen.findByRole("heading", { name: "Apple Watch" })
      await userEvent.click(screen.getByRole("button", { name: "Next" }))
      await screen.findByRole("heading", { name: "Sony ZX330BT" })

      await userEvent.type(screen.getByLabelText("Search Item"), "sony")

      await waitFor(() =>
        expect(
          requests
            .filter((r) => searchOf(r) === "sony")
            .map((r) => new URLSearchParams(String(r.params)).get("page"))
        ).toEqual(["1"])
      )
    })
  })

  describe("product cards", () => {
    it("links the image and the name to the product route as one link", async () => {
      serve()
      renderCatalog()
      const [first] = (await loaded()).map((card) => within(card))

      const link = first.getByRole("link")
      expect(link).toHaveAttribute("href", "/shop/PRD-1001")
      expect(within(link).getByRole("img")).toBeInTheDocument()
      expect(
        within(link).getByRole("heading", { name: "Apple Watch" })
      ).toBeInTheDocument()
    })

    it("keeps the add-to-bag button outside the link", async () => {
      serve()
      renderCatalog()
      const [first] = (await loaded()).map((card) => within(card))

      const button = first.getByRole("button", {
        name: "Add Apple Watch, Series 5 SE, to bag",
      })

      expect(button.closest("a")).toBeNull()
    })

    it("shows the server's price with its currency", async () => {
      serve()
      renderCatalog()
      await loaded()

      expect(screen.getByText("Rs 52,999.00")).toBeInTheDocument()
      expect(screen.getByText("Rs 3,999.00")).toBeInTheDocument()
    })

    it("draws a card for a product without a picture or a subtitle", async () => {
      serve([createStorefrontProduct({ name: "Bare Mug", image: null })])
      renderCatalog()
      const [card] = (await loaded()).map((c) => within(c))

      expect(
        card.getByRole("heading", { name: "Bare Mug" })
      ).toBeInTheDocument()
      expect(card.queryByRole("img")).not.toBeInTheDocument()
      expect(
        card.getByRole("button", { name: "Add Bare Mug, to bag" })
      ).toBeInTheDocument()
    })

    it("marks a sold-out product and does not let it be added", async () => {
      serve([
        createStorefrontProduct({
          name: "Gone Lamp",
          subtitle: "Brass",
          inStock: false,
        }),
      ])
      renderCatalog()
      const [card] = (await loaded()).map((c) => within(c))

      expect(card.getByText("Sold out")).toBeVisible()
      expect(
        card.getByRole("button", { name: "Gone Lamp, Brass, is sold out" })
      ).toBeDisabled()
    })
  })

  describe("bag", () => {
    it("starts empty", async () => {
      serve()
      renderCatalog()
      await loaded()

      expect(bagPreview().queryAllByRole("listitem")).toHaveLength(0)
      expect(bagPreview().getByText("Your bag is empty.")).toBeInTheDocument()
    })

    it("adds a product as one entry and announces it", async () => {
      serve()
      renderCatalog()
      await loaded()

      await userEvent.click(
        screen.getByRole("button", {
          name: "Add Apple Watch, Series 5 SE, to bag",
        })
      )

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(1)
      expect(
        within(entries[0]).getByText("Apple Watch, Series 5 SE, quantity 1")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Apple Watch, Series 5 SE, added to bag. Quantity 1.")
      ).toBeInTheDocument()
    })

    it("raises the quantity instead of duplicating a product", async () => {
      serve()
      renderCatalog()
      await loaded()
      const add = screen.getByRole("button", {
        name: "Add Apple Watch, Series 5 SE, to bag",
      })

      await userEvent.click(add)
      await userEvent.click(add)

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(1)
      expect(
        within(entries[0]).getByText("Apple Watch, Series 5 SE, quantity 2")
      ).toBeInTheDocument()
    })

    it("does not move keyboard focus when something is added", async () => {
      serve()
      renderCatalog()
      await loaded()
      const add = screen.getByRole("button", {
        name: "Add Sony ZX330BT, Light Grey, to bag",
      })

      add.focus()
      await userEvent.keyboard("{Enter}")

      expect(add).toHaveFocus()
    })

    it("links View Bag to the bag route", async () => {
      serve()
      renderCatalog()
      await loaded()

      expect(
        bagPreview().getByRole("link", { name: "View Bag" })
      ).toHaveAttribute("href", "/bag")
    })
  })
})
