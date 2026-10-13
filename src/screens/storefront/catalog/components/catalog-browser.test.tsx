import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { BagPreview } from "@/components/storefront/layout/bag-preview"
import { demoBagItems } from "@/mocks/storefront/bag"
import { storefrontProducts } from "@/mocks/storefront/products"
import { BagProvider } from "@/providers/bag-provider"
import { CatalogBrowser } from "@/screens/storefront/catalog/components/catalog-browser"

function renderCatalog() {
  return render(
    <BagProvider initialItems={demoBagItems}>
      <CatalogBrowser products={storefrontProducts} />
      <BagPreview />
    </BagProvider>
  )
}

const catalogCards = () =>
  screen.getAllByRole("article").map((card) => within(card))

function bagPreview() {
  return within(screen.getByRole("complementary", { name: "Bag" }))
}

describe("CatalogBrowser", () => {
  describe("search", () => {
    it("shows every product until something is typed", () => {
      renderCatalog()

      expect(screen.getAllByRole("article")).toHaveLength(7)
      expect(screen.getByLabelText("Search Item")).toHaveValue("")
    })

    it("filters by name and by subtitle, ignoring case", async () => {
      renderCatalog()
      const search = screen.getByLabelText("Search Item")

      await userEvent.type(search, "APPLE")
      expect(screen.getAllByRole("article")).toHaveLength(1)
      expect(
        screen.getByRole("heading", { name: "Apple Watch" })
      ).toBeInTheDocument()

      await userEvent.clear(search)
      await userEvent.type(search, "product red")
      expect(screen.getAllByRole("article")).toHaveLength(1)
      expect(screen.getByText("Product RED")).toBeInTheDocument()
    })

    it("restores the catalog when the search is cleared", async () => {
      renderCatalog()
      const search = screen.getByLabelText("Search Item")

      await userEvent.type(search, "sony")
      expect(screen.getAllByRole("article")).toHaveLength(1)

      await userEvent.clear(search)
      expect(screen.getAllByRole("article")).toHaveLength(7)
    })

    it("explains an empty result, announces it, and offers a way back", async () => {
      renderCatalog()
      const search = screen.getByLabelText("Search Item")

      await userEvent.type(search, "galaxy")

      expect(screen.queryAllByRole("article")).toHaveLength(0)
      expect(
        screen.getByText("No products match “galaxy”.")
      ).toBeInTheDocument()
      expect(
        screen
          .getAllByRole("status")
          .some((status) => status.textContent === "0 products found")
      ).toBe(true)

      await userEvent.click(
        screen.getByRole("button", { name: "Clear search" })
      )

      expect(screen.getAllByRole("article")).toHaveLength(7)
      expect(search).toHaveValue("")
      expect(search).toHaveFocus()
    })
  })

  describe("product cards", () => {
    it("links the image and the name to the product route as one link", () => {
      renderCatalog()
      const [watch] = catalogCards()

      const link = watch.getByRole("link")
      expect(link).toHaveAttribute("href", "/shop/apple-watch-series-5-se")
      expect(within(link).getByRole("img")).toBeInTheDocument()
      expect(
        within(link).getByRole("heading", { name: "Apple Watch" })
      ).toBeInTheDocument()
    })

    it("keeps the add-to-bag button outside the link", () => {
      renderCatalog()
      const [watch] = catalogCards()

      const button = watch.getByRole("button", {
        name: "Add Apple Watch, Series 5 SE, to bag",
      })

      expect(button.closest("a")).toBeNull()
    })

    it("shows the price the way the design writes it", () => {
      renderCatalog()

      expect(screen.getByText("$ 3249.99")).toBeInTheDocument()
      expect(screen.getByText("$ 529.99")).toBeInTheDocument()
    })
  })

  describe("bag", () => {
    it("starts with the seeded items, one entry each", () => {
      renderCatalog()

      expect(bagPreview().getAllByRole("listitem")).toHaveLength(4)
    })

    it("adds a new product as one entry and announces it", async () => {
      renderCatalog()

      await userEvent.click(
        screen.getByRole("button", {
          name: "Add Apple Watch, Series 5 SE, to bag",
        })
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

    it("raises the quantity instead of duplicating a product", async () => {
      renderCatalog()
      const add = screen.getByRole("button", {
        name: "Add Apple Watch, Series 5 SE, to bag",
      })

      await userEvent.click(add)
      await userEvent.click(add)

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(5)
      expect(within(entries[4]).getByText("Quantity 2")).toBeInTheDocument()
      expect(
        screen.getByText("Apple Watch, Series 5 SE, added to bag. Quantity 2.")
      ).toBeInTheDocument()
    })

    it("increments a product that came with the seeded bag", async () => {
      renderCatalog()

      await userEvent.click(
        screen.getByRole("button", {
          name: "Add MacBook Pro 16”, Silver - M1 Pro, to bag",
        })
      )

      const entries = bagPreview().getAllByRole("listitem")
      expect(entries).toHaveLength(4)
      expect(within(entries[0]).getByText("Quantity 2")).toBeInTheDocument()
    })

    it("does not move keyboard focus when something is added", async () => {
      renderCatalog()
      const add = screen.getByRole("button", {
        name: "Add Sony ZX330BT, Light Grey, to bag",
      })

      add.focus()
      await userEvent.keyboard("{Enter}")

      expect(add).toHaveFocus()
    })

    it("links View Bag to the bag route", () => {
      renderCatalog()

      expect(
        bagPreview().getByRole("link", { name: "View Bag" })
      ).toHaveAttribute("href", "/bag")
    })
  })
})
