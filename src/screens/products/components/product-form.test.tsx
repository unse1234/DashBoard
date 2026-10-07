import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { getMockProductById } from "@/lib/products/product.mock-data"
import { ProductForm } from "@/screens/products/components/product-form"

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }))

const user = userEvent.setup()

async function chooseOption(selectName: string, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: selectName }))
  await user.click(await screen.findByRole("option", { name: optionName }))
}

async function fillRequiredFields() {
  await user.type(screen.getByLabelText("Product Name"), "  Studio Monitor  ")
  await user.type(screen.getByLabelText("SKU"), "ELC-MON-27")
  await chooseOption("Category", "Electronics")
  await user.type(screen.getByLabelText("Selling Price (USD)"), "349.99")
  await user.type(screen.getByLabelText("Stock Quantity"), "12")
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ProductForm (create)", () => {
  it("groups the fields into labelled sections", () => {
    render(<ProductForm />)

    for (const heading of [
      "Basic information",
      "Categorization",
      "Pricing and inventory",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument()
    }
    for (const label of [
      "Product Name",
      "SKU",
      "Brand (optional)",
      "Description (optional)",
      "Selling Price (USD)",
      "Cost Price (USD, optional)",
      "Stock Quantity",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole("combobox", { name: "Category" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent("Active")
  })

  it("links Cancel back to the products list", () => {
    render(<ProductForm />)

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/dashboard/products"
    )
  })

  it("starts empty with a category to choose", () => {
    render(<ProductForm />)

    expect(screen.getByLabelText("Product Name")).toHaveValue("")
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "Select a category"
    )
  })

  it("shows an error for every missing required field and does not submit", async () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    expect(await screen.findByText("Enter a product name.")).toBeInTheDocument()
    expect(screen.getByText("Enter a SKU.")).toBeInTheDocument()
    expect(screen.getByText("Select a category.")).toBeInTheDocument()
    expect(screen.getByText("Enter a selling price.")).toBeInTheDocument()
    expect(screen.getByText("Enter the stock quantity.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("ties each error to its field", async () => {
    render(<ProductForm />)

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    const name = await screen.findByLabelText("Product Name")
    expect(name).toBeInvalid()
    expect(name).toHaveAccessibleDescription("Enter a product name.")
  })

  it("rejects negative amounts and fractional stock", async () => {
    render(<ProductForm />)

    await fillRequiredFields()
    await user.clear(screen.getByLabelText("Selling Price (USD)"))
    await user.type(screen.getByLabelText("Selling Price (USD)"), "-5")
    await user.type(screen.getByLabelText("Cost Price (USD, optional)"), "-1")
    await user.clear(screen.getByLabelText("Stock Quantity"))
    await user.type(screen.getByLabelText("Stock Quantity"), "2.5")
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    expect(
      await screen.findByText("Selling price must not be negative.")
    ).toBeInTheDocument()
    expect(screen.getByText("Cost price must not be negative.")).toBeInTheDocument()
    expect(
      screen.getByText("Stock quantity must be a whole number.")
    ).toBeInTheDocument()
  })

  it("passes the validated, converted values to onSubmit", async () => {
    const onSubmit = vi.fn()
    render(<ProductForm onSubmit={onSubmit} />)

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Studio Monitor",
      sku: "ELC-MON-27",
      brand: null,
      description: null,
      category: "Electronics",
      status: "active",
      price: 349.99,
      costPrice: null,
      stock: 12,
    })
    expect(toast.info).not.toHaveBeenCalled()
  })

  it("says nothing was saved when no submit handler is connected", async () => {
    render(<ProductForm />)

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await vi.waitFor(() => expect(toast.info).toHaveBeenCalledTimes(1))
    expect(toast.info).toHaveBeenCalledWith(
      "Nothing was saved",
      expect.objectContaining({ description: expect.any(String) })
    )
  })
})

describe("ProductForm (edit)", () => {
  const product = getMockProductById("PRD-2041")!

  it("prefills every field from the product", () => {
    render(<ProductForm product={product} />)

    expect(screen.getByLabelText("Product Name")).toHaveValue(product.name)
    expect(screen.getByLabelText("SKU")).toHaveValue("AUD-ANC-500-BLK")
    expect(screen.getByLabelText("Brand (optional)")).toHaveValue("Soundcraft")
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      product.description
    )
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "Electronics"
    )
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent("Active")
    expect(screen.getByLabelText("Selling Price (USD)")).toHaveValue("249.00")
    expect(screen.getByLabelText("Cost Price (USD, optional)")).toHaveValue("138.50")
    expect(screen.getByLabelText("Stock Quantity")).toHaveValue("184")
  })

  it("shows the status and leaves the cost price empty when it is unknown", () => {
    render(<ProductForm product={getMockProductById("PRD-2126")!} />)

    expect(screen.getByLabelText("Cost Price (USD, optional)")).toHaveValue("")
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Inactive"
    )
  })

  it("leaves the brand and description empty when the product has none", () => {
    render(<ProductForm product={getMockProductById("PRD-2104")!} />)

    expect(screen.getByLabelText("Brand (optional)")).toHaveValue("")
    expect(screen.getByLabelText("Description (optional)")).toHaveValue("")
  })

  it("offers Update Product and cancels back to the product", () => {
    render(<ProductForm product={product} />)

    expect(screen.getByRole("button", { name: "Update Product" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-2041"
    )
  })

  it("submits the edited values", async () => {
    const onSubmit = vi.fn()
    render(<ProductForm product={product} onSubmit={onSubmit} />)

    await user.clear(screen.getByLabelText("Stock Quantity"))
    await user.type(screen.getByLabelText("Stock Quantity"), "0")
    await chooseOption("Status", "Inactive")
    await user.click(screen.getByRole("button", { name: "Update Product" }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: "AUD-ANC-500-BLK",
        status: "inactive",
        price: 249,
        costPrice: 138.5,
        stock: 0,
      })
    )
  })
})
