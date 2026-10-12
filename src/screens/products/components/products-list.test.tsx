import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  archiveProducts,
  listCategories,
  listProducts,
  type ProductPage,
} from "@/lib/products/product.api"
import { ProductsList } from "@/screens/products/components/products-list"
import { ProductsTotal } from "@/screens/products/components/products-total"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { categoryFixtures, createProduct } from "@/test-utils/product-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/lib/products/product.api")
vi.mock("@/hooks/use-auth")
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const headphones = createProduct({
  id: "PRD-2041",
  name: "Aurora Wireless Noise-Cancelling Headphones",
})
const skillet = createProduct({
  id: "PRD-2042",
  name: "Pre-Seasoned Cast Iron Skillet, 12 inch",
  sku: "HK-CIS-12",
  category: "Home & Kitchen",
  brand: "Hearthstone",
  price: 39.95,
  stock: 62,
})
const bottle = createProduct({
  id: "PRD-2063",
  name: "Trail Insulated Water Bottle, 750 ml",
  sku: "SPT-BTL-750-GRN",
  category: "Sports & Outdoors",
  price: 24.5,
  stock: 1240,
})
const keyboard = createProduct({
  id: "PRD-2090",
  name: "Hot-Swappable Mechanical Keyboard",
  sku: "ELE-KBD-HS",
  stock: 0,
})
const desk = createProduct({
  id: "PRD-2078",
  name: "Walnut Standing Desk, 160 × 80 cm",
  sku: "FUR-DSK-WLN-160",
  status: "inactive",
  stock: 14,
})
const notebook = createProduct({
  id: "PRD-2102",
  name: "A5 Dot Grid Notebook, 3-Pack",
  sku: "OFF-NTB-A5",
  brand: null,
  price: 11.99,
  stock: 540,
})
const allProducts = [headphones, skillet, bottle, keyboard, desk, notebook]

function page(products = allProducts, totalRecords = 134): ProductPage {
  return { products, totalRecords }
}

function signIn(role: "ADMIN" | "STAFF") {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role }),
  })
}

async function renderList() {
  renderWithQuery(<ProductsList />)
  await screen.findByText("Aurora Wireless Noise-Cancelling Headphones")
  return userEvent.setup()
}

function lastQuery() {
  return vi.mocked(listProducts).mock.lastCall?.[0]
}

function getRow(name: string) {
  return screen.getByRole("row", { name: new RegExp(name) })
}

function getSearchBox() {
  return screen.getByRole("searchbox", {
    name: "Search products by name or SKU",
  })
}

function getBulkActions() {
  return screen.getByRole("region", { name: "Bulk actions" })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listProducts).mockResolvedValue(page())
  vi.mocked(listCategories).mockResolvedValue(categoryFixtures)
  signIn("ADMIN")
})

describe("ProductsList loading", () => {
  it("shows placeholder rows until the first page arrives", async () => {
    let resolve: (value: ProductPage) => void = () => {}
    vi.mocked(listProducts).mockReturnValue(
      new Promise((res) => (resolve = res))
    )
    renderWithQuery(<ProductsList />)

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByText("No products found")).not.toBeInTheDocument()

    resolve(page())
    expect(
      await screen.findByText("Aurora Wireless Noise-Cancelling Headphones")
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "false")
    )
  })

  it("requests the first page of ten, unfiltered", async () => {
    await renderList()

    expect(listProducts).toHaveBeenCalledWith(
      { search: "", category: "all", status: "all", page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it("explains a failed load and retries on request", async () => {
    vi.mocked(listProducts).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    renderWithQuery(<ProductsList />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load products")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByText("Aurora Wireless Noise-Cancelling Headphones")
    ).toBeInTheDocument()
    expect(listProducts).toHaveBeenCalledTimes(2)
  })
})

describe("ProductsList table", () => {
  it("renders a row per product with the expected columns", async () => {
    await renderList()

    expect(screen.getAllByRole("row")).toHaveLength(allProducts.length + 1)
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

  it("links each product name to its details page", async () => {
    await renderList()

    expect(
      screen.getByRole("link", {
        name: "Aurora Wireless Noise-Cancelling Headphones",
      })
    ).toHaveAttribute("href", "/dashboard/products/PRD-2041")
  })

  it("formats price and stock", async () => {
    await renderList()
    const row = within(getRow("Trail Insulated Water Bottle"))

    expect(row.getByText("$24.50")).toBeInTheDocument()
    expect(row.getByText("1,240")).toBeInTheDocument()
  })

  it("shows the category the API names", async () => {
    await renderList()

    expect(
      within(getRow("Pre-Seasoned Cast Iron Skillet")).getByText(
        "Home & Kitchen"
      )
    ).toBeInTheDocument()
  })

  it("derives the status from the product status and its stock", async () => {
    await renderList()

    expect(
      within(getRow("Aurora Wireless")).getByText("Active")
    ).toBeInTheDocument()
    expect(
      within(getRow("Hot-Swappable Mechanical Keyboard")).getByText(
        "Out of Stock"
      )
    ).toBeInTheDocument()
    expect(
      within(getRow("Walnut Standing Desk")).getByText("Inactive")
    ).toBeInTheDocument()
  })

  it("marks a missing brand", async () => {
    await renderList()

    expect(
      within(getRow("A5 Dot Grid Notebook")).getByText("Not set")
    ).toBeInTheDocument()
  })

  it("shows the empty state when nothing matches", async () => {
    vi.mocked(listProducts).mockResolvedValue(page([], 0))
    renderWithQuery(<ProductsList />)

    expect(await screen.findByText("No products found")).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: "Select all products" })
    ).toHaveAttribute("aria-disabled", "true")
  })
})

describe("ProductsList row actions", () => {
  it("links View and Edit to the product's pages", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("button", {
        name: "Actions for Pre-Seasoned Cast Iron Skillet, 12 inch",
      })
    )

    expect(
      await screen.findByRole("menuitem", { name: "View" })
    ).toHaveAttribute("href", "/dashboard/products/PRD-2042")
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-2042/edit"
    )
  })
})

describe("ProductsList selection", () => {
  it("shows no bulk actions until a product is selected", async () => {
    await renderList()

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("selects a product and reports the count", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    )

    const bulkActions = getBulkActions()
    expect(
      within(bulkActions).getByText("1 product selected")
    ).toBeInTheDocument()
    expect(
      within(bulkActions).getByRole("button", { name: "Export" })
    ).toBeInTheDocument()
    expect(
      within(bulkActions).getByRole("button", { name: "Delete" })
    ).toBeInTheDocument()
    expect(getRow("A5 Dot Grid Notebook")).toHaveAttribute(
      "data-state",
      "selected"
    )
  })

  it("selects every displayed product with the header checkbox", async () => {
    const user = await renderList()
    const selectAll = screen.getByRole("checkbox", {
      name: "Select all products",
    })

    await user.click(selectAll)

    expect(selectAll).toBeChecked()
    expect(
      screen.getByText(`${allProducts.length} products selected`)
    ).toBeInTheDocument()
    for (const product of allProducts) {
      expect(
        screen.getByRole("checkbox", { name: `Select ${product.name}` })
      ).toBeChecked()
    }
  })

  it("shows the header checkbox as mixed while only some rows are selected", async () => {
    const user = await renderList()
    const selectAll = screen.getByRole("checkbox", {
      name: "Select all products",
    })

    await user.click(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    )

    expect(selectAll).toHaveAttribute("aria-checked", "mixed")
  })

  it("clears the selection from the header checkbox when everything is selected", async () => {
    const user = await renderList()
    const selectAll = screen.getByRole("checkbox", {
      name: "Select all products",
    })

    await user.click(selectAll)
    await user.click(selectAll)

    expect(selectAll).not.toBeChecked()
    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("selects everything when the header checkbox is used while some rows are selected", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    )
    await user.click(
      screen.getByRole("checkbox", { name: "Select all products" })
    )

    expect(
      screen.getByText(`${allProducts.length} products selected`)
    ).toBeInTheDocument()
  })

  it("clears the selection with the bulk actions button", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    )
    await user.click(screen.getByRole("button", { name: "Clear selection" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
    expect(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    ).not.toBeChecked()
  })

  it("drops the selection when the page changes", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("checkbox", { name: "Select all products" })
    )
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })

  it("drops the selection when a filter changes", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("checkbox", { name: "Select all products" })
    )
    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Inactive" }))

    expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
  })
})

describe("ProductsList deleting", () => {
  async function selectNotebook(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole("checkbox", {
        name: "Select A5 Dot Grid Notebook, 3-Pack",
      })
    )
  }

  it("is not offered to staff", async () => {
    signIn("STAFF")
    const user = await renderList()

    await selectNotebook(user)

    expect(
      within(getBulkActions()).queryByRole("button", { name: "Delete" })
    ).toBeNull()
    expect(
      within(getBulkActions()).getByRole("button", { name: "Clear selection" })
    ).toBeInTheDocument()
  })

  it("asks first, and deletes nothing if the dialog is dismissed", async () => {
    const user = await renderList()
    await selectNotebook(user)

    await user.click(
      within(getBulkActions()).getByRole("button", { name: "Delete" })
    )
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Delete 1 product?")
    expect(dialog).toHaveTextContent("keep their details")

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    expect(archiveProducts).not.toHaveBeenCalled()
    expect(getBulkActions()).toBeInTheDocument()
  })

  it("archives the selected products, then refreshes the list and clears the selection", async () => {
    vi.mocked(archiveProducts).mockResolvedValue(2)
    const user = await renderList()
    await selectNotebook(user)
    await user.click(
      screen.getByRole("checkbox", { name: `Select ${keyboard.name}` })
    )
    expect(listProducts).toHaveBeenCalledTimes(1)
    vi.mocked(listProducts).mockResolvedValue(
      page([headphones, skillet, bottle, desk], 132)
    )

    await user.click(
      within(getBulkActions()).getByRole("button", { name: "Delete" })
    )
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Delete 2 products?")
    await user.click(
      within(dialog).getByRole("button", { name: "Delete products" })
    )

    await waitFor(() =>
      expect(archiveProducts).toHaveBeenCalledWith(
        expect.arrayContaining(["PRD-2102", "PRD-2090"])
      )
    )
    expect(vi.mocked(archiveProducts).mock.calls[0][0]).toHaveLength(2)
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("2 products were deleted.")
    )
    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Bulk actions" })).toBeNull()
    )
    expect(screen.queryByText(notebook.name)).not.toBeInTheDocument()
  })

  it("reports why it failed and keeps the selection", async () => {
    vi.mocked(archiveProducts).mockRejectedValue(
      new ApiError(403, ["Insufficient permissions"])
    )
    const user = await renderList()
    await selectNotebook(user)

    await user.click(
      within(getBulkActions()).getByRole("button", { name: "Delete" })
    )
    const dialog = await screen.findByRole("dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Delete product" })
    )

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Insufficient permissions"
    )
    expect(toast.success).not.toHaveBeenCalled()
    // The page behind the open dialog is hidden from the accessibility tree.
    expect(
      screen.getByRole("row", { name: /A5 Dot Grid Notebook/, hidden: true })
    ).toHaveAttribute("data-state", "selected")
  })
})

describe("ProductsList search and filters", () => {
  it("keeps the typed search text and searches once typing pauses", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))

    await user.type(getSearchBox(), "AUD-ANC")

    expect(getSearchBox()).toHaveValue("AUD-ANC")
    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ search: "AUD-ANC", page: 1 })
    )
    // Not one request per keystroke.
    const searches = vi
      .mocked(listProducts)
      .mock.calls.filter(([query]) => query.search !== "")
    expect(searches).toHaveLength(1)
  })

  it("defaults the filters to all categories and all statuses", async () => {
    await renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by category" })
    ).toHaveTextContent("All Categories")
    expect(
      screen.getByRole("combobox", { name: "Filter by status" })
    ).toHaveTextContent("All Statuses")
  })

  it("offers the categories the API returns and filters by the one chosen", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("combobox", { name: "Filter by category" })
    )
    for (const { name } of categoryFixtures) {
      expect(await screen.findByRole("option", { name })).toBeInTheDocument()
    }
    await user.click(screen.getByRole("option", { name: "Furniture" }))

    expect(
      screen.getByRole("combobox", { name: "Filter by category" })
    ).toHaveTextContent("Furniture")
    await waitFor(() =>
      expect(lastQuery()).toMatchObject({
        category: "cat-furniture",
        page: 1,
      })
    )
  })

  it("filters by status, including out of stock", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(
      await screen.findByRole("option", { name: "Out of Stock" })
    )

    expect(
      screen.getByRole("combobox", { name: "Filter by status" })
    ).toHaveTextContent("Out of Stock")
    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ status: "out-of-stock" })
    )
  })

  it("combines the filters with the search", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("combobox", { name: "Filter by category" })
    )
    await user.click(await screen.findByRole("option", { name: "Furniture" }))
    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Inactive" }))
    await user.type(getSearchBox(), "desk")

    await waitFor(() =>
      expect(lastQuery()).toEqual({
        search: "desk",
        category: "cat-furniture",
        status: "inactive",
        page: 1,
        pageSize: 10,
      })
    )
  })
})

describe("ProductsList pagination", () => {
  it("reports the visible range and the total", async () => {
    await renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText("134")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "products pagination" })
    ).toBeInTheDocument()
  })

  it("asks the API for the next page and keeps the rows until it arrives", async () => {
    const user = await renderList()
    let resolveNext: (value: ProductPage) => void = () => {}
    vi.mocked(listProducts).mockReturnValueOnce(
      new Promise((res) => (resolveNext = res))
    )

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Go to previous page" })
    ).toBeEnabled()
    // The previous page stays on screen (dimmed) instead of blanking the table.
    expect(screen.getByText(skillet.name)).toBeInTheDocument()
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")

    resolveNext(page([createProduct({ id: "PRD-3000", name: "Next Item" })]))
    expect(await screen.findByText("Next Item")).toBeInTheDocument()
  })

  it("lets the page size be changed", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ pageSize: 20, page: 1 })
    )
  })

  it("steps back to the last page when the list has shrunk", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))

    // Page 4 comes back empty: there are now only enough products for two pages.
    vi.mocked(listProducts).mockResolvedValue(page([], 15))
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
  })
})

describe("ProductsTotal", () => {
  it("shows the overall total, sharing the list's first request", async () => {
    renderWithQuery(
      <>
        <ProductsTotal />
        <ProductsList />
      </>
    )

    expect(
      await screen.findByText("134 products in total.")
    ).toBeInTheDocument()
    expect(listProducts).toHaveBeenCalledTimes(1)
  })

  it("shows nothing until the total is known", () => {
    vi.mocked(listProducts).mockReturnValue(new Promise(() => {}))
    const { container } = renderWithQuery(<ProductsTotal />)

    expect(container).toBeEmptyDOMElement()
  })
})
