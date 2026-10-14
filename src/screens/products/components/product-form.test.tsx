import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api/api-error"
import { SKU_TAKEN_MESSAGE } from "@/constants/product.constants"
import { ProductForm } from "@/screens/products/components/product-form"
import { categoryFixtures, createProduct } from "@/test-utils/product-fixtures"

const user = userEvent.setup()

function renderForm(
  props: Partial<React.ComponentProps<typeof ProductForm>> = {}
) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  render(
    <ProductForm categories={categoryFixtures} onSubmit={onSubmit} {...props} />
  )
  return { onSubmit }
}

async function chooseOption(selectName: string, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: selectName }))
  await user.click(await screen.findByRole("option", { name: optionName }))
}

async function fillRequiredFields() {
  await user.type(screen.getByLabelText("Product Name"), "  Studio Monitor  ")
  await user.type(screen.getByLabelText("SKU"), "ELC-MON-27")
  await chooseOption("Category", "Electronics")
  await chooseOption("Currency", "US dollar (USD)")
  await user.type(screen.getByLabelText("Selling Price (USD)"), "349.99")
  await user.type(screen.getByLabelText("Stock Quantity"), "12")
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ProductForm (create)", () => {
  it("groups the fields into labelled sections", () => {
    renderForm()

    for (const heading of [
      "Basic information",
      "Categorization",
      "Pricing and inventory",
      "Online shop listing",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: heading })
      ).toBeInTheDocument()
    }
    for (const label of [
      "Product Name",
      "SKU",
      "Brand (optional)",
      "Description (optional)",
      "Selling Price",
      "Cost Price (optional)",
      "Stock Quantity",
      "Subtitle (optional)",
      "Main Image (optional)",
      "More Images (optional)",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(
      screen.getByRole("combobox", { name: "Category" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Currency" })
    ).toHaveTextContent("Select a currency")
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Active"
    )
  })

  it("links Cancel back to the products list", () => {
    renderForm()

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/dashboard/products"
    )
  })

  it("starts empty with a category to choose", () => {
    renderForm()

    expect(screen.getByLabelText("Product Name")).toHaveValue("")
    expect(
      screen.getByRole("combobox", { name: "Category" })
    ).toHaveTextContent("Select a category")
  })

  it("offers the categories it was given", async () => {
    renderForm()

    await user.click(screen.getByRole("combobox", { name: "Category" }))

    for (const { name } of categoryFixtures) {
      expect(await screen.findByRole("option", { name })).toBeInTheDocument()
    }
  })

  it("shows an error for every missing required field and does not submit", async () => {
    const { onSubmit } = renderForm()

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    expect(await screen.findByText("Enter a product name.")).toBeInTheDocument()
    expect(screen.getByText("Enter a SKU.")).toBeInTheDocument()
    expect(screen.getByText("Select a category.")).toBeInTheDocument()
    expect(screen.getByText("Select a currency.")).toBeInTheDocument()
    expect(screen.getByText("Enter a selling price.")).toBeInTheDocument()
    expect(screen.getByText("Enter the stock quantity.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("ties each error to its field", async () => {
    renderForm()

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    const name = await screen.findByLabelText("Product Name")
    expect(name).toBeInvalid()
    expect(name).toHaveAccessibleDescription("Enter a product name.")
  })

  it("rejects negative amounts and fractional stock", async () => {
    renderForm()

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
    expect(
      screen.getByText("Cost price must not be negative.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Stock quantity must be a whole number.")
    ).toBeInTheDocument()
  })

  it("passes the validated, converted values to onSubmit", async () => {
    const { onSubmit } = renderForm()

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Studio Monitor",
      sku: "ELC-MON-27",
      subtitle: null,
      brand: null,
      description: null,
      imageUrl: null,
      galleryUrls: [],
      categoryId: "cat-electronics",
      status: "active",
      currency: "USD",
      price: 349.99,
      costPrice: null,
      stock: 12,
    })
  })

  it("names the chosen currency on the amounts, and sends the shop's fields", async () => {
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText("Product Name"), "Studio Monitor")
    await user.type(screen.getByLabelText("SKU"), "ELC-MON-27")
    await chooseOption("Category", "Electronics")
    await chooseOption("Currency", "Pakistani rupee (PKR)")
    expect(screen.getByLabelText("Selling Price (PKR)")).toBeInTheDocument()
    expect(
      screen.getByLabelText("Cost Price (PKR, optional)")
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Selling Price (PKR)"), "159999")
    await user.type(screen.getByLabelText("Stock Quantity"), "5")
    await user.type(screen.getByLabelText("Subtitle (optional)"), "4K, 27 inch")
    await user.type(
      screen.getByLabelText("Main Image (optional)"),
      "/images/monitor.png"
    )
    await user.type(
      screen.getByLabelText("More Images (optional)"),
      "/images/a.png{Enter}https://cdn.example.com/b.jpg"
    )
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "PKR",
        price: 159999,
        subtitle: "4K, 27 inch",
        imageUrl: "/images/monitor.png",
        galleryUrls: ["/images/a.png", "https://cdn.example.com/b.jpg"],
      })
    )
  })

  it("points out a picture address that is not usable, without submitting", async () => {
    const { onSubmit } = renderForm()

    await fillRequiredFields()
    await user.type(
      screen.getByLabelText("Main Image (optional)"),
      "javascript:alert(1)"
    )
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    expect(
      await screen.findByText(
        "Use an http(s) address or a path on the shop that starts with “/”."
      )
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("disables the form and shows progress while saving, so it cannot be sent twice", async () => {
    let finish: () => void = () => {}
    const onSubmit = vi
      .fn()
      .mockReturnValue(new Promise<void>((resolve) => (finish = resolve)))
    renderForm({ onSubmit })

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    const saving = await screen.findByRole("button", { name: "Creating…" })
    expect(saving).toBeInTheDocument()
    expect(screen.getByLabelText("Product Name")).toBeDisabled()
    await user.click(saving)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    finish()
    expect(
      await screen.findByRole("button", { name: "Create Product" })
    ).toBeEnabled()
  })
})

describe("ProductForm (server errors)", () => {
  it("points a taken SKU out on the SKU field", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(409, [SKU_TAKEN_MESSAGE]))
    renderForm({ onSubmit })

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    const sku = await screen.findByLabelText("SKU")
    await vi.waitFor(() => expect(sku).toBeInvalid())
    expect(sku).toHaveAccessibleDescription(
      "Another product already uses this SKU."
    )
    // Only the field's own error: nothing is shown above the form.
    expect(screen.getAllByRole("alert")).toHaveLength(1)
    // What was typed is kept, so the SKU can simply be changed.
    expect(screen.getByLabelText("Product Name")).toHaveValue(
      "  Studio Monitor  "
    )
  })

  it("shows any other failure above the form", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(500, ["internal detail"]))
    renderForm({ onSubmit })

    await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Create Product" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Something went wrong on our side")
    expect(alert).not.toHaveTextContent("internal detail")
    expect(screen.queryByRole("button", { name: "Reload product" })).toBeNull()
  })

  it("explains a product that changed in the meantime and offers to reload it", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, [
          "This product was changed by someone else. Reload it and try again.",
        ])
      )
    const onReload = vi.fn()
    renderForm({ product: createProduct(), onSubmit, onReload })

    await user.click(screen.getByRole("button", { name: "Update Product" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This product was changed by someone else."
    )
    await user.click(screen.getByRole("button", { name: "Reload product" }))
    expect(onReload).toHaveBeenCalledTimes(1)
  })
})

describe("ProductForm (edit)", () => {
  const product = createProduct()

  it("prefills every field from the product", () => {
    renderForm({ product })

    expect(screen.getByLabelText("Product Name")).toHaveValue(product.name)
    expect(screen.getByLabelText("SKU")).toHaveValue("AUD-ANC-500-BLK")
    expect(screen.getByLabelText("Brand (optional)")).toHaveValue("Soundcraft")
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      product.description
    )
    expect(
      screen.getByRole("combobox", { name: "Category" })
    ).toHaveTextContent("Electronics")
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Active"
    )
    expect(screen.getByLabelText("Selling Price (USD)")).toHaveValue("249.00")
    expect(screen.getByLabelText("Cost Price (USD, optional)")).toHaveValue(
      "138.50"
    )
    expect(screen.getByLabelText("Stock Quantity")).toHaveValue("184")
  })

  it("shows the status and leaves the cost price empty when it is unknown", () => {
    renderForm({
      product: createProduct({ status: "inactive", costPrice: null }),
    })

    expect(screen.getByLabelText("Cost Price (USD, optional)")).toHaveValue("")
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Inactive"
    )
  })

  it("leaves the brand and description empty when the product has none", () => {
    renderForm({ product: createProduct({ brand: null, description: null }) })

    expect(screen.getByLabelText("Brand (optional)")).toHaveValue("")
    expect(screen.getByLabelText("Description (optional)")).toHaveValue("")
  })

  it("prefills the currency and the shop's fields, and labels the amounts in that currency", () => {
    renderForm({
      product: createProduct({
        currency: "PKR",
        price: 159999,
        costPrice: 120000,
        subtitle: "4K, 27 inch",
        imageUrl: "/images/monitor.png",
        galleryUrls: ["/images/a.png", "https://cdn.example.com/b.jpg"],
      }),
    })

    expect(
      screen.getByRole("combobox", { name: "Currency" })
    ).toHaveTextContent("Pakistani rupee (PKR)")
    expect(screen.getByLabelText("Selling Price (PKR)")).toHaveValue(
      "159999.00"
    )
    expect(screen.getByLabelText("Cost Price (PKR, optional)")).toHaveValue(
      "120000.00"
    )
    expect(screen.getByLabelText("Subtitle (optional)")).toHaveValue(
      "4K, 27 inch"
    )
    expect(screen.getByLabelText("Main Image (optional)")).toHaveValue(
      "/images/monitor.png"
    )
    expect(screen.getByLabelText("More Images (optional)")).toHaveValue(
      "/images/a.png\nhttps://cdn.example.com/b.jpg"
    )
  })

  it("leaves the shop's fields empty for a product that has none", () => {
    renderForm({ product })

    expect(screen.getByLabelText("Subtitle (optional)")).toHaveValue("")
    expect(screen.getByLabelText("Main Image (optional)")).toHaveValue("")
    expect(screen.getByLabelText("More Images (optional)")).toHaveValue("")
  })

  it("offers Update Product and cancels back to the product", () => {
    renderForm({ product })

    expect(
      screen.getByRole("button", { name: "Update Product" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/dashboard/products/PRD-1001"
    )
  })

  it("submits the edited values", async () => {
    const { onSubmit } = renderForm({ product })

    await user.clear(screen.getByLabelText("Stock Quantity"))
    await user.type(screen.getByLabelText("Stock Quantity"), "0")
    await chooseOption("Status", "Inactive")
    await user.click(screen.getByRole("button", { name: "Update Product" }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: "AUD-ANC-500-BLK",
        categoryId: "cat-electronics",
        status: "inactive",
        price: 249,
        costPrice: 138.5,
        stock: 0,
      })
    )
  })

  it("does not show the Reload action unless the save was refused for a changed product", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(500, ["internal detail"]))
    renderForm({ product, onSubmit, onReload: vi.fn() })

    await user.click(screen.getByRole("button", { name: "Update Product" }))

    await screen.findByRole("alert")
    expect(screen.queryByRole("button", { name: "Reload product" })).toBeNull()
  })
})
