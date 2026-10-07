import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  mockProducts,
  mockTotalProducts,
} from "@/lib/products/product.mock-data"
import { ProductsList } from "@/screens/products/components/products-list"

function renderList(products = mockProducts) {
  return render(
    <ProductsList products={products} totalRecords={mockTotalProducts} />
  )
}

function getRow(name: string) {
  return screen.getByRole("row", { name: new RegExp(name) })
}

describe("ProductsList table", () => {
  it("renders a row per product with the expected columns", () => {
    renderList()

    expect(screen.getAllByRole("row")).toHaveLength(mockProducts.length + 1)
    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual([
      "",
      "Product",
      "SKU",
      "Category",
      "Brand",
      "Price",
      "Stock",
      "Status",
      "Actions",
    ])
  })

  it("links each product name to its details page", () => {
    renderList()

    expect(
      screen.getByRole("link", { name: "Aurora Wireless Noise-Cancelling Headphones" })
    ).toHaveAttribute("href", "/dashboard/products/PRD-2041")
  })

  it("formats price and stock", () => {
    renderList()
    const row = within(getRow("Trail Insulated Water Bottle"))

    expect(row.getByText("$24.50")).toBeInTheDocument()
    expect(row.getByText("1,240")).toBeInTheDocument()
  })

  it("derives the status from the product status and its stock", () => {
    renderList()

    expect(
      within(getRow("Aurora Wireless")).getByText("Active")
    ).toBeInTheDocument()
    expect(
      within(getRow("Hot-Swappable Mechanical Keyboard")).getByText("Out of Stock")
    ).toBeInTheDocument()
    expect(
      within(getRow("Walnut Standing Desk")).getByText("Inactive")
    ).toBeInTheDocument()
  })

  it("marks a missing brand", () => {
    renderList()

    expect(within(getRow("A5 Dot Grid Notebook")).getByText("Not set")).toBeInTheDocument()
  })

  it("shows the empty state when there are no products", () => {
    renderList([])

    expect(screen.getByText("No products found")).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: "Select all products" })
    ).toHaveAttribute("aria-disabled", "true")
  })
})

describe("ProductsList row actions", () => {
  it("links View and Edit to the product's pages", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", {
        name: "Actions for Pre-Seasoned Cast Iron Skillet, 12 inch",
      })
    )

    expect(await screen.findByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-2042"
    )
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-2042/edit"
    )
  })
})

describe("ProductsList selection", () => {
  it("shows no bulk actions until a product is selected", () => {
    renderList()

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("selects a product and reports the count", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("checkbox", { name: "Select A5 Dot Grid Notebook, 3-Pack" })
    )

    const bulkActions = screen.getByRole("region", { name: "Bulk actions" })
    expect(within(bulkActions).getByText("1 product selected")).toBeInTheDocument()
    expect(
      within(bulkActions).getByRole("button", { name: "Export" })
    ).toBeInTheDocument()
    expect(
      within(bulkActions).getByRole("button", { name: "Delete" })
    ).toBeInTheDocument()
    expect(getRow("A5 Dot Grid Notebook")).toHaveAttribute("data-state", "selected")
  })

  it("selects every displayed product with the header checkbox", async () => {
    renderList()
    const user = userEvent.setup()
    const selectAll = screen.getByRole("checkbox", { name: "Select all products" })

    await user.click(selectAll)

    expect(selectAll).toBeChecked()
    expect(
      screen.getByText(`${mockProducts.length} products selected`)
    ).toBeInTheDocument()
    for (const product of mockProducts) {
      expect(
        screen.getByRole("checkbox", { name: `Select ${product.name}` })
      ).toBeChecked()
    }
  })

  it("shows the header checkbox as mixed while only some rows are selected", async () => {
    renderList()
    const user = userEvent.setup()
    const selectAll = screen.getByRole("checkbox", { name: "Select all products" })

    await user.click(
      screen.getByRole("checkbox", { name: "Select A5 Dot Grid Notebook, 3-Pack" })
    )

    expect(selectAll).toHaveAttribute("aria-checked", "mixed")
  })

  it("clears the selection from the header checkbox when everything is selected", async () => {
    renderList()
    const user = userEvent.setup()
    const selectAll = screen.getByRole("checkbox", { name: "Select all products" })

    await user.click(selectAll)
    await user.click(selectAll)

    expect(selectAll).not.toBeChecked()
    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("selects everything when the header checkbox is used while some rows are selected", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("checkbox", { name: "Select A5 Dot Grid Notebook, 3-Pack" })
    )
    await user.click(screen.getByRole("checkbox", { name: "Select all products" }))

    expect(
      screen.getByText(`${mockProducts.length} products selected`)
    ).toBeInTheDocument()
  })

  it("clears the selection with the bulk actions button", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("checkbox", { name: "Select A5 Dot Grid Notebook, 3-Pack" })
    )
    await user.click(screen.getByRole("button", { name: "Clear selection" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
    expect(
      screen.getByRole("checkbox", { name: "Select A5 Dot Grid Notebook, 3-Pack" })
    ).not.toBeChecked()
  })

  it("drops the selection when the page changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("checkbox", { name: "Select all products" }))
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("drops the selection when a filter changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("checkbox", { name: "Select all products" }))
    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Inactive" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })
})

describe("ProductsList pagination", () => {
  it("reports the visible range and total", () => {
    renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText(String(mockTotalProducts))).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "products pagination" })
    ).toBeInTheDocument()
  })

  it("moves between pages", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeEnabled()
  })
})

describe("ProductsList toolbar", () => {
  it("keeps the typed search text", async () => {
    renderList()
    const user = userEvent.setup()
    const search = screen.getByRole("searchbox", {
      name: "Search products by name or SKU",
    })

    await user.type(search, "AUD-ANC")

    expect(search).toHaveValue("AUD-ANC")
  })

  it("defaults the filters to all categories and all statuses", () => {
    renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by category" })
    ).toHaveTextContent("All Categories")
    expect(
      screen.getByRole("combobox", { name: "Filter by status" })
    ).toHaveTextContent("All Statuses")
  })

  it("lets the category and status filters be changed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Filter by category" }))
    await user.click(await screen.findByRole("option", { name: "Furniture" }))
    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Out of Stock" }))

    expect(
      screen.getByRole("combobox", { name: "Filter by category" })
    ).toHaveTextContent("Furniture")
    expect(
      screen.getByRole("combobox", { name: "Filter by status" })
    ).toHaveTextContent("Out of Stock")
  })
})
