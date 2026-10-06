import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProductDetailsHeader } from "@/components/products/product-details-header"
import { ProductDetailsTabs } from "@/components/products/product-details-tabs"
import {
  getMockProductById,
  getMockProductHistory,
} from "@/lib/products/product.mock-data"

function renderTabs(productId: string) {
  const product = getMockProductById(productId)!
  return render(
    <ProductDetailsTabs
      product={product}
      history={getMockProductHistory(productId)}
    />
  )
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

describe("ProductDetailsHeader", () => {
  it("shows the name, SKU and status, and links Edit to the edit page", () => {
    render(<ProductDetailsHeader product={getMockProductById("PRD-2090")!} />)

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
    renderTabs("PRD-2041")

    expect(getValue("Product Name")).toHaveTextContent(
      "Aurora Wireless Noise-Cancelling Headphones"
    )
    expect(getValue("SKU")).toHaveTextContent("AUD-ANC-500-BLK")
    expect(getValue("Category")).toHaveTextContent("Electronics")
    expect(getValue("Brand")).toHaveTextContent("Soundcraft")
    expect(within(getValue("Status")).getByText("Active")).toBeInTheDocument()
    expect(getValue("Description")).toHaveTextContent(/adaptive noise cancelling/)
    expect(getValue("Created At")).toHaveTextContent("Feb 11, 2025, 10:20 AM UTC")
    expect(getValue("Last Updated")).toHaveTextContent("Sep 18, 2026, 2:05 PM UTC")
  })

  it("shows pricing with the calculated margin", () => {
    renderTabs("PRD-2041")

    expect(getValue("Selling Price")).toHaveTextContent("$249.00")
    expect(getValue("Cost Price")).toHaveTextContent("$138.50")
    expect(getValue("Margin")).toHaveTextContent("44.4%")
  })

  it("does not invent a margin when the cost price is unknown", () => {
    renderTabs("PRD-2126")

    expect(getValue("Cost Price")).toHaveTextContent("Not set")
    expect(getValue("Margin")).toHaveTextContent("Not available")
  })

  it("marks missing optional details", () => {
    renderTabs("PRD-2104")

    expect(getValue("Brand")).toHaveTextContent("Not set")
    expect(getValue("Description")).toHaveTextContent("Not set")
  })

  it("shows the stock quantity and availability", () => {
    renderTabs("PRD-2063")

    expect(getValue("Stock Quantity")).toHaveTextContent("1,240")
    expect(getValue("Availability")).toHaveTextContent("In stock")
  })

  it("shows a product without stock as out of stock", () => {
    renderTabs("PRD-2111")

    expect(getValue("Stock Quantity")).toHaveTextContent("0")
    expect(getValue("Availability")).toHaveTextContent("Out of stock")
    expect(within(getValue("Status")).getByText("Out of Stock")).toBeInTheDocument()
  })
})

describe("ProductDetailsTabs history and analytics", () => {
  it("lists the changes newest first with who made them", async () => {
    renderTabs("PRD-2041")
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    const entries = screen.getAllByRole("listitem")
    expect(entries).toHaveLength(3)
    expect(entries[0]).toHaveTextContent("Price changed from $269.00 to $249.00")
    expect(entries[0]).toHaveTextContent("Priya Raman")
    expect(entries[0]).toHaveTextContent("Sep 18, 2026, 2:05 PM UTC")
    expect(entries[2]).toHaveTextContent("Product created")
  })

  it("attributes automatic changes to the system", async () => {
    renderTabs("PRD-2057")
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("System")
  })

  it("says so when a product has no history", async () => {
    render(
      <ProductDetailsTabs product={getMockProductById("PRD-2041")!} history={[]} />
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "History" }))

    expect(
      screen.getByText("No changes have been recorded for this product.")
    ).toBeInTheDocument()
  })

  it("shows a restrained placeholder instead of analytics", async () => {
    renderTabs("PRD-2041")
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "Analytics" }))

    expect(
      screen.getByText("Analytics are not available for this product yet.")
    ).toBeInTheDocument()
  })
})
