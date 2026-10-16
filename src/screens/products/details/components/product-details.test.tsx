import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { getProduct, getProductHistory } from "@/services/products/product.api"
import { ProductDetails } from "@/screens/products/details/components/product-details"
import { ProductDetailsHeader } from "@/screens/products/details/components/product-details-header"
import { ProductDetailsTabs } from "@/screens/products/details/components/product-details-tabs"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createHistoryEntry,
  createProduct,
} from "@/test-utils/product-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/services/products/product.api")
vi.mock("@/hooks/auth/use-auth")

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(getProductHistory).mockResolvedValue([])
})

function renderTabs(product = createProduct()) {
  return renderWithQuery(<ProductDetailsTabs product={product} />)
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

describe("ProductDetails loading", () => {
  it("shows the page's outline until the product arrives, then the product", async () => {
    let resolve: (value: ReturnType<typeof createProduct>) => void = () => {}
    vi.mocked(getProduct).mockReturnValue(new Promise((res) => (resolve = res)))
    const { container } = renderWithQuery(
      <ProductDetails productId="PRD-1001" />
    )

    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
    expect(screen.queryByRole("tab")).toBeNull()

    resolve(createProduct())
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Aurora Wireless Noise-Cancelling Headphones",
      })
    ).toBeInTheDocument()
    expect(getProduct).toHaveBeenCalledWith("PRD-1001", expect.any(AbortSignal))
  })

  it.each([404, 400])(
    "says the product was not found for a %s",
    async (status) => {
      vi.mocked(getProduct).mockRejectedValue(new ApiError(status, ["nope"]))
      renderWithQuery(<ProductDetails productId="PRD-9" />)

      expect(await screen.findByText("Product not found")).toBeInTheDocument()
      expect(screen.queryByRole("alert")).toBeNull()
    }
  )

  it("explains any other failure and retries on request", async () => {
    vi.mocked(getProduct).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    vi.mocked(getProduct).mockResolvedValue(createProduct())
    renderWithQuery(<ProductDetails productId="PRD-1001" />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load this product")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Aurora Wireless Noise-Cancelling Headphones",
      })
    ).toBeInTheDocument()
  })

  it("does not ask for the history until its tab is opened", async () => {
    vi.mocked(getProduct).mockResolvedValue(createProduct())
    renderWithQuery(<ProductDetails productId="PRD-1001" />)
    const user = userEvent.setup()
    await screen.findByRole("tab", { name: "History" })

    expect(getProductHistory).not.toHaveBeenCalled()

    await user.click(screen.getByRole("tab", { name: "History" }))

    await waitFor(() =>
      expect(getProductHistory).toHaveBeenCalledWith(
        "PRD-1001",
        expect.any(AbortSignal)
      )
    )
  })
})

describe("ProductDetailsHeader", () => {
  it("shows the name, SKU and status, and links Edit to the edit page", () => {
    renderWithQuery(
      <ProductDetailsHeader
        product={createProduct({
          id: "PRD-2090",
          name: "Hot-Swappable Mechanical Keyboard, 75%",
          sku: "ELC-KBD-75-HS",
          stock: 0,
        })}
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Hot-Swappable Mechanical Keyboard, 75%",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("ELC-KBD-75-HS")).toBeInTheDocument()
    expect(screen.getByText("Out of Stock")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-2090/edit"
    )
  })
})

describe("ProductDetailsTabs overview", () => {
  it("shows the product information", () => {
    renderTabs()

    expect(getValue("Product Name")).toHaveTextContent(
      "Aurora Wireless Noise-Cancelling Headphones"
    )
    expect(getValue("SKU")).toHaveTextContent("AUD-ANC-500-BLK")
    expect(getValue("Category")).toHaveTextContent("Electronics")
    expect(getValue("Brand")).toHaveTextContent("Soundcraft")
    expect(within(getValue("Status")).getByText("Active")).toBeInTheDocument()
    expect(getValue("Description")).toHaveTextContent(
      /adaptive noise cancelling/
    )
    expect(getValue("Created At")).toHaveTextContent(
      "Feb 11, 2025, 10:20 AM UTC"
    )
    expect(getValue("Last Updated")).toHaveTextContent(
      "Sep 18, 2026, 2:05 PM UTC"
    )
  })

  it("shows pricing with the calculated margin", () => {
    renderTabs()

    expect(getValue("Selling Price")).toHaveTextContent("PKR 249.00")
    expect(getValue("Cost Price")).toHaveTextContent("PKR 138.50")
    expect(getValue("Margin")).toHaveTextContent("44.4%")
  })

  it("does not invent a margin when the cost price is unknown", () => {
    // The API answers with no margin when there is no cost price.
    renderTabs(createProduct({ costPrice: null, margin: null }))

    expect(getValue("Cost Price")).toHaveTextContent("Not set")
    expect(getValue("Margin")).toHaveTextContent("Not available")
  })

  it("shows the margin the API worked out, and amounts in the product's currency", () => {
    renderTabs(
      createProduct({
        currency: "PKR",
        price: 1500,
        costPrice: 1000,
        margin: 0.3333,
      })
    )

    expect(getValue("Selling Price")).toHaveTextContent("PKR 1,500.00")
    expect(getValue("Cost Price")).toHaveTextContent("PKR 1,000.00")
    expect(getValue("Margin")).toHaveTextContent("33.3%")
  })

  it("shows the shop's subtitle and pictures", () => {
    renderTabs(
      createProduct({
        subtitle: "Wireless, noise cancelling",
        imageUrl: "/images/aurora.png",
        galleryUrls: ["https://cdn.example.com/aurora-2.jpg"],
      })
    )

    expect(getValue("Subtitle")).toHaveTextContent("Wireless, noise cancelling")
    const images = getValue("Shop Images").querySelectorAll("img")
    expect(images).toHaveLength(2)
    expect(images[0].getAttribute("src")).toContain("aurora.png")
    expect(images[1]).toHaveAttribute("src", "https://cdn.example.com/aurora-2.jpg")
  })

  it("marks missing optional details", () => {
    renderTabs(createProduct({ brand: null, description: null }))

    expect(getValue("Brand")).toHaveTextContent("Not set")
    expect(getValue("Description")).toHaveTextContent("Not set")
  })

  it("shows the stock quantity and availability", () => {
    renderTabs(createProduct({ stock: 1240 }))

    expect(getValue("Stock Quantity")).toHaveTextContent("1,240")
    expect(getValue("Availability")).toHaveTextContent("In stock")
  })

  it("shows a product without stock as out of stock", () => {
    renderTabs(createProduct({ stock: 0 }))

    expect(getValue("Stock Quantity")).toHaveTextContent("0")
    expect(getValue("Availability")).toHaveTextContent("Out of stock")
    expect(
      within(getValue("Status")).getByText("Out of Stock")
    ).toBeInTheDocument()
  })
})

describe("ProductDetailsTabs history and analytics", () => {
  it("lists the changes the API returns, newest first, with who made them", async () => {
    vi.mocked(getProductHistory).mockResolvedValue([
      createHistoryEntry({ id: "e3" }),
      createHistoryEntry({
        id: "e2",
        change: "Stock updated from 96 to 184",
        occurredAt: "2026-08-02T09:30:00Z",
        actor: "Jonathan Whitfield",
      }),
      createHistoryEntry({
        id: "e1",
        change: "Product created",
        occurredAt: "2025-02-11T10:20:00Z",
      }),
    ])
    renderTabs()
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    const entries = await screen.findAllByRole("listitem")
    expect(entries).toHaveLength(3)
    expect(entries[0]).toHaveTextContent(
      "Price changed from PKR 269.00 to PKR 249.00"
    )
    expect(entries[0]).toHaveTextContent("Priya Raman")
    expect(entries[0]).toHaveTextContent("Sep 18, 2026, 2:05 PM UTC")
    expect(entries[2]).toHaveTextContent("Product created")
  })

  it("attributes automatic changes to the system", async () => {
    vi.mocked(getProductHistory).mockResolvedValue([
      createHistoryEntry({
        change: "Stock reduced from 10 to 8 by order ORD-10002",
        actor: null,
      }),
    ])
    renderTabs()
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    expect((await screen.findAllByRole("listitem"))[0]).toHaveTextContent(
      "System"
    )
  })

  it("says so when a product has no history", async () => {
    renderTabs()
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    expect(
      await screen.findByText("No changes have been recorded for this product.")
    ).toBeInTheDocument()
  })

  it("explains a history that could not be loaded and retries on request", async () => {
    vi.mocked(getProductHistory).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    vi.mocked(getProductHistory).mockResolvedValue([createHistoryEntry()])
    renderTabs()
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load the history"
    )
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findAllByRole("listitem")).toHaveLength(1)
  })

  it("shows a restrained placeholder instead of analytics", async () => {
    renderTabs()
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "Analytics" }))

    expect(
      screen.getByText("Analytics are not available for this product yet.")
    ).toBeInTheDocument()
  })
})
