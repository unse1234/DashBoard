import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { demoBagItems } from "@/mocks/storefront/bag"
import { BagProvider } from "@/providers/bag-provider"
import { ProductDetailsScreen } from "@/screens/storefront/product-details"
import { ProductNotFound } from "@/screens/storefront/product-details/components/product-not-found"

vi.mock("next/navigation", () => ({
  usePathname: () => "/shop/apple-watch-series-5-se",
  // Next's real notFound() throws; the sentinel lets the test observe that.
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))
// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Cabin: () => ({ variable: "font-cabin" }),
}))

beforeAll(() => {
  // jsdom has no matchMedia; the menu reads it to choose its side.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

function renderScreen(productId: string) {
  return render(
    <BagProvider initialItems={demoBagItems}>
      <ProductDetailsScreen productId={productId} />
    </BagProvider>
  )
}

const content = () => within(screen.getByRole("main"))

function bagPreview() {
  return within(screen.getByRole("complementary", { name: "Bag" }))
}

describe("ProductDetailsScreen", () => {
  describe("the reference product", () => {
    it("shows its name, subtitle, rating, price and short description", () => {
      renderScreen("apple-watch-series-5-se")

      expect(
        content().getByRole("heading", { level: 1, name: "Apple Watch" })
      ).toBeInTheDocument()
      expect(content().getByText("Series 5 SE")).toBeInTheDocument()
      expect(
        content().getByRole("img", { name: "Rated 4.5 out of 5" })
      ).toBeInTheDocument()
      expect(content().getByText("$ 529.99")).toBeInTheDocument()
      expect(
        content().getByText(
          /^Lorem ipsum dolor sit amet.*Vitae elementum libero\.$/
        )
      ).toBeInTheDocument()
    })

    it("shows a divider and a Description section with the long copy", () => {
      renderScreen("apple-watch-series-5-se")

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
        within(description).getAllByText(/Lorem ipsum|Orci vel|Dignissim|Odio/)
      ).not.toHaveLength(0)
    })

    it("links Back to the shop", () => {
      renderScreen("apple-watch-series-5-se")

      expect(content().getByRole("link", { name: "Back" })).toHaveAttribute(
        "href",
        "/shop"
      )
    })

    it("has no reviews, variants or quantity controls", () => {
      renderScreen("apple-watch-series-5-se")

      expect(content().queryByRole("spinbutton")).not.toBeInTheDocument()
      expect(content().queryByRole("combobox")).not.toBeInTheDocument()
      expect(content().queryByText(/review/i)).not.toBeInTheDocument()
    })
  })

  describe("other catalog products", () => {
    it("shows the product the id names", () => {
      renderScreen("macbook-pro-16-silver-m1-pro")

      expect(
        content().getByRole("heading", { level: 1, name: "MacBook Pro 16”" })
      ).toBeInTheDocument()
      expect(content().getByText("Silver - M1 Pro")).toBeInTheDocument()
      expect(content().getByText("$ 3249.99")).toBeInTheDocument()
      expect(
        content().getByRole("img", { name: "Rated 5.0 out of 5" })
      ).toBeInTheDocument()
    })
  })

  describe("add to bag", () => {
    it("adds the product to the shared bag as one entry and announces it", async () => {
      renderScreen("apple-watch-series-5-se")
      expect(bagPreview().getAllByRole("listitem")).toHaveLength(4)

      await userEvent.click(
        content().getByRole("button", { name: "Add to Bag" })
      )

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(5)
      expect(
        within(entries[4]).getByRole("img", {
          name: "Apple Watch, Series 5 SE",
        })
      ).toBeInTheDocument()
      expect(within(entries[4]).getByText("Quantity 1")).toBeInTheDocument()
      expect(
        screen.getByText("Apple Watch, Series 5 SE, added to bag. Quantity 1.")
      ).toBeInTheDocument()
    })

    it("raises the quantity on a repeated add", async () => {
      renderScreen("apple-watch-series-5-se")
      const add = content().getByRole("button", { name: "Add to Bag" })

      await userEvent.click(add)
      await userEvent.click(add)

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(5)
      expect(within(entries[4]).getByText("Quantity 2")).toBeInTheDocument()
    })

    it("raises the quantity of a product that is already in the bag", async () => {
      renderScreen("macbook-pro-16-silver-m1-pro")

      await userEvent.click(
        content().getByRole("button", { name: "Add to Bag" })
      )

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(4)
      expect(within(entries[0]).getByText("Quantity 2")).toBeInTheDocument()
    })

    it("does not move keyboard focus", async () => {
      renderScreen("apple-watch-series-5-se")
      const add = content().getByRole("button", { name: "Add to Bag" })

      add.focus()
      await userEvent.keyboard("{Enter}")

      expect(add).toHaveFocus()
    })
  })

  describe("unknown product", () => {
    it("hands off to the route's not-found boundary", () => {
      // React logs the error it rethrows; keep the test output readable.
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {})

      expect(() => renderScreen("not-a-product")).toThrow("NEXT_NOT_FOUND")

      consoleError.mockRestore()
    })
  })
})

describe("ProductNotFound", () => {
  it("explains the problem and links back to the shop", () => {
    render(
      <BagProvider initialItems={demoBagItems}>
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
