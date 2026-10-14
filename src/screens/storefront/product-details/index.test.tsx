import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { BagProvider } from "@/providers/bag-provider"
import { ProductDetailsScreen } from "@/screens/storefront/product-details"
import { ProductNotFound } from "@/screens/storefront/product-details/components/product-not-found"
import { mockApi } from "@/test-utils/mock-api"
import { renderWithQuery } from "@/test-utils/render"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { StorefrontProduct } from "@/types/storefront/product.types"

vi.mock("next/navigation", () => ({
  usePathname: () => "/shop/PRD-1001",
}))
// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Cabin: () => ({ variable: "font-cabin" }),
}))

const watch = createStorefrontProduct({
  id: "PRD-1001",
  name: "Apple Watch",
  subtitle: "Series 5 SE",
  description: "A watch that does the usual.\n\nIt also counts steps.",
  price: 52999,
  image: { url: "/images/watch-front.png", alt: "Apple Watch" },
  gallery: [{ url: "/images/watch-side.png", alt: "Apple Watch, view 2" }],
})

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

beforeAll(() => {
  // jsdom has no matchMedia; the menu reads it to choose its side.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

/** A catalog that has `products` and answers anything else with the API's 404. */
function serve(...products: StorefrontProduct[]) {
  api = mockApi((request) => {
    const match = /^\/storefront\/products\/(.+)$/.exec(request.url)
    const product = products.find(
      (item) => item.id === decodeURIComponent(match?.[1] ?? "")
    )
    return product
      ? { data: product }
      : { status: 404, data: { statusCode: 404, message: "Product not found" } }
  })
  return api
}

function renderScreen(productId: string) {
  return renderWithQuery(
    <BagProvider initialItems={[]}>
      <ProductDetailsScreen productId={productId} />
    </BagProvider>
  )
}

const content = () => within(screen.getByRole("main"))

function bagPreview() {
  return within(screen.getByRole("complementary", { name: "Bag" }))
}

/** Waits until the product's name is on screen as the page heading. */
const loaded = (name: string) =>
  screen.findByRole("heading", { level: 1, name })

describe("ProductDetailsScreen", () => {
  describe("a product from the API", () => {
    it("asks for the product by its id, on the public route", async () => {
      const { requests } = serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")

      expect(requests).toHaveLength(1)
      expect(requests[0].url).toBe("/storefront/products/PRD-1001")
      expect(requests[0].headers.authorization).toBeUndefined()
    })

    it("shows the name, subtitle and price in rupees", async () => {
      serve(watch)
      renderScreen("PRD-1001")

      expect(await loaded("Apple Watch")).toBeInTheDocument()
      expect(content().getByText("Series 5 SE")).toBeInTheDocument()
      expect(content().getByText("Rs 52,999.00")).toBeInTheDocument()
    })

    it("has no rating, review or quantity controls", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")

      expect(content().queryByRole("spinbutton")).not.toBeInTheDocument()
      expect(content().queryByRole("combobox")).not.toBeInTheDocument()
      expect(content().queryByText(/review|rated/i)).not.toBeInTheDocument()
      expect(content().queryByRole("img", { name: /rated/i })).toBeNull()
    })

    it("shows the description as paragraphs under a divider", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")

      expect(content().getByRole("separator")).toBeInTheDocument()
      const description = content().getByRole("region", {
        name: "Description",
      })
      expect(
        within(description).getByRole("heading", {
          level: 2,
          name: "Description",
        })
      ).toBeInTheDocument()
      expect(
        within(description).getByText("A watch that does the usual.")
      ).toBeInTheDocument()
      expect(
        within(description).getByText("It also counts steps.")
      ).toBeInTheDocument()
    })

    it("leaves out the description section for a product without one", async () => {
      serve(createStorefrontProduct({ id: "PRD-1002", name: "Plain Mug" }))
      renderScreen("PRD-1002")
      await loaded("Plain Mug")

      expect(
        content().queryByRole("region", { name: "Description" })
      ).not.toBeInTheDocument()
      expect(content().queryByRole("separator")).not.toBeInTheDocument()
    })

    it("offers the primary picture and the gallery as choices", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")

      const choices = content().getAllByRole("button", {
        name: /^Show image \d of 2$/,
      })
      expect(choices).toHaveLength(2)
      expect(
        content().getByRole("img", { name: "Apple Watch" })
      ).toBeInTheDocument()

      await userEvent.click(choices[1])
      expect(
        content().getByRole("img", { name: "Apple Watch, view 2" })
      ).toBeInTheDocument()
    })

    it("omits the subtitle line for a product without one", async () => {
      serve(createStorefrontProduct({ id: "PRD-1002", name: "Plain Mug" }))
      renderScreen("PRD-1002")
      await loaded("Plain Mug")

      expect(content().queryByText("null")).not.toBeInTheDocument()
      // Only the price follows the name: no empty subtitle line.
      const info = content().getByRole("heading", { level: 1 }).parentElement
      expect(
        Array.from(info?.querySelectorAll("p") ?? []).map((p) => p.textContent)
      ).toEqual(["Rs 1,500.00"])
    })

    it("links Back to the shop", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")

      expect(content().getByRole("link", { name: "Back" })).toHaveAttribute(
        "href",
        "/shop"
      )
    })
  })

  describe("loading and failure", () => {
    it("announces that it is loading", async () => {
      let release: () => void = () => {}
      api = mockApi(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ data: watch })
          })
      )
      renderScreen("PRD-1001")

      expect(screen.getByText("Loading product")).toBeInTheDocument()

      // The request leaves a moment after the first render.
      await waitFor(() => expect(api?.requests).toHaveLength(1))
      release()
      await loaded("Apple Watch")
      expect(screen.queryByText("Loading product")).not.toBeInTheDocument()
    })

    it("explains a server failure and tries again on request", async () => {
      let fail = true
      api = mockApi(() =>
        fail
          ? { status: 500, data: { statusCode: 500, message: "boom" } }
          : { data: watch }
      )
      renderScreen("PRD-1001")

      // The query client in tests does not retry, so the failure is immediate.
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn’t load this product."
      )
      expect(
        screen.queryByRole("heading", { level: 1 })
      ).not.toBeInTheDocument()

      fail = false
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))

      expect(await loaded("Apple Watch")).toBeInTheDocument()
    })
  })

  describe("sold-out product", () => {
    it("says so and cannot be added", async () => {
      serve(
        createStorefrontProduct({
          id: "PRD-1003",
          name: "Gone Lamp",
          inStock: false,
        })
      )
      renderScreen("PRD-1003")
      await loaded("Gone Lamp")

      expect(content().getByText("Sold out")).toBeVisible()
      expect(
        content().getByRole("button", { name: "Add to Bag" })
      ).toBeDisabled()
    })
  })

  describe("add to bag", () => {
    it("adds the product to the shared bag as one entry and announces it", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")
      expect(bagPreview().queryAllByRole("listitem")).toHaveLength(0)

      await userEvent.click(
        content().getByRole("button", { name: "Add to Bag" })
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

    it("raises the quantity on a repeated add", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")
      const add = content().getByRole("button", { name: "Add to Bag" })

      await userEvent.click(add)
      await userEvent.click(add)

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(1)
      expect(
        within(entries[0]).getByText("Apple Watch, Series 5 SE, quantity 2")
      ).toBeInTheDocument()
    })

    it("does not move keyboard focus", async () => {
      serve(watch)
      renderScreen("PRD-1001")
      await loaded("Apple Watch")
      const add = content().getByRole("button", { name: "Add to Bag" })

      add.focus()
      await userEvent.keyboard("{Enter}")

      expect(add).toHaveFocus()
    })
  })

  describe("unknown product", () => {
    it("shows the not-found page for an id the shop does not have", async () => {
      serve(watch)
      renderScreen("PRD-9999")

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Product not found",
        })
      ).toBeInTheDocument()
      expect(
        content().getByRole("link", { name: "Back to shop" })
      ).toHaveAttribute("href", "/shop")
      await waitFor(() =>
        expect(screen.queryByText("Loading product")).not.toBeInTheDocument()
      )
    })
  })
})

describe("ProductNotFound", () => {
  it("explains the problem and links back to the shop", () => {
    renderWithQuery(
      <BagProvider initialItems={[]}>
        <ProductNotFound />
      </BagProvider>
    )

    expect(
      content().getByRole("heading", { level: 1, name: "Product not found" })
    ).toBeInTheDocument()
    expect(
      content().getByRole("link", { name: "Back to shop" })
    ).toHaveAttribute("href", "/shop")
  })
})
