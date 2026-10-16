import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useProductFormWorkflow } from "@/hooks/products/use-product-form-workflow"
import { ProductImageEditor } from "@/screens/products/components/product-image-editor"
import { NewProduct } from "@/screens/products/new/components/new-product"
import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  createProduct as createRequest,
  listCategories,
} from "@/services/products/product.api"
import {
  deleteProductImage,
  getProductImages,
  uploadProductImages,
  orderProductImages,
} from "@/services/products/product-images.api"
import { categoryFixtures, createProduct } from "@/test-utils/product-fixtures"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { renderWithQuery } from "@/test-utils/render"
import { productKeys } from "@/hooks/products/product.keys"

vi.mock("@/hooks/auth/use-auth")
vi.mock("@/services/products/product.api")
vi.mock("@/services/products/product-images.api")
const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
const product = createProduct()
const image = (id: string, position = 0) => ({
  id,
  url: `https://api.example.com/uploads/products/${id}.png`,
  isCover: position === 0,
  position,
})
const png = (name: string) => new File(["png"], name, { type: "image/png" })

function Editor({ existing = false }: { existing?: boolean }) {
  const workflow = useProductFormWorkflow(existing ? product : undefined)
  return <ProductImageEditor editor={workflow.editor} deferred={!existing} />
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(listCategories).mockResolvedValue(categoryFixtures)
  vi.mocked(getProductImages).mockResolvedValue([])
  vi.mocked(createRequest).mockResolvedValue(product)
  let index = 0
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL() {
        return `blob:test-${++index}`
      }
      static revokeObjectURL() {}
    }
  )
})
afterEach(() => vi.unstubAllGlobals())

it("previews multiple files, orders the pending cover, and removes a selection without deleting saved data", async () => {
  const user = userEvent.setup()
  renderWithQuery(<Editor />)
  await user.upload(screen.getByLabelText("Add product images"), [
    png("a.png"),
    png("b.png"),
  ])
  expect(screen.getByRole("img", { name: "a.png" })).toHaveAttribute(
    "src",
    "blob:test-1"
  )
  await user.click(
    screen.getByRole("button", { name: "Move selected b.png earlier" })
  )
  const pending = screen.getByRole("list", { name: "Pending product images" })
  expect(within(pending).getAllByRole("listitem")[0]).toHaveTextContent("b.png")
  expect(within(pending).getAllByRole("listitem")[0]).toHaveTextContent(
    "Pending cover"
  )
  await user.click(
    screen.getByRole("button", { name: "Remove selected b.png" })
  )
  expect(screen.queryByRole("img", { name: "b.png" })).toBeNull()
  expect(deleteProductImage).not.toHaveBeenCalled()
  expect(uploadProductImages).not.toHaveBeenCalled()
})

it("shows client validation and keeps valid pending files", async () => {
  const user = userEvent.setup({ applyAccept: false })
  renderWithQuery(<Editor />)
  await user.upload(
    screen.getByLabelText("Add product images"),
    png("good.png")
  )
  await user.upload(
    screen.getByLabelText("Add product images"),
    new File(["svg"], "bad.svg", { type: "image/svg+xml" })
  )
  expect(screen.getByRole("alert")).toHaveTextContent("JPEG, PNG, or WebP")
  expect(screen.getByRole("img", { name: "good.png" })).toBeInTheDocument()
})

it("confirms saved deletion and renders the promoted cover from the backend", async () => {
  const user = userEvent.setup()
  vi.mocked(getProductImages).mockResolvedValue([image("a"), image("b", 1)])
  vi.mocked(deleteProductImage).mockResolvedValue({
    data: [image("b")],
    product: { ...product, version: 2 },
  })
  const { queryClient } = renderWithQuery(<Editor existing />)
  queryClient.setQueryData(productKeys.detail(product.id), product)
  await user.click(
    await screen.findByRole("button", { name: "Delete saved image 1" })
  )
  expect(deleteProductImage).not.toHaveBeenCalled()
  await user.click(
    screen.getByRole("button", { name: "Confirm delete image 1" })
  )
  await waitFor(() =>
    expect(deleteProductImage).toHaveBeenCalledWith(product.id, "a")
  )
  await waitFor(() =>
    expect(
      screen.getByRole("list", { name: "Saved product images" }).children
    ).toHaveLength(1)
  )
  expect(screen.getByRole("img", { name: "Saved image 1" })).toHaveAttribute(
    "src",
    image("b").url
  )
  expect(screen.getByText("Cover")).toBeInTheDocument()
})

it("lets a legacy gallery-only product select its first image as cover", async () => {
  const user = userEvent.setup()
  const legacy = { ...image("legacy"), isCover: false }
  vi.mocked(getProductImages).mockResolvedValue([legacy])
  vi.mocked(orderProductImages).mockResolvedValue({
    ...product,
    imageUrl: legacy.url,
    version: product.version + 1,
  })
  const { queryClient } = renderWithQuery(<Editor existing />)
  queryClient.setQueryData(productKeys.detail(product.id), product)
  const selectCover = await screen.findByRole("button", {
    name: "Make image 1 cover",
  })
  expect(selectCover).toBeEnabled()
  await user.click(selectCover)
  await waitFor(() =>
    expect(orderProductImages).toHaveBeenCalledWith(
      product.id,
      product.version,
      [legacy]
    )
  )
  expect(await screen.findByText("Cover")).toBeInTheDocument()
})

it("allows replacement at the limit, shows server failures, and retains the original image", async () => {
  const user = userEvent.setup()
  vi.mocked(getProductImages).mockResolvedValue(
    Array.from({ length: 8 }, (_, i) => image(String(i), i))
  )
  vi.mocked(uploadProductImages).mockRejectedValue(
    new ApiError(401, ["Please sign in again."])
  )
  renderWithQuery(<Editor existing />)
  await screen.findByRole("img", { name: "Saved image 1" })
  expect(screen.getByLabelText("Add product images")).toBeDisabled()
  await user.upload(
    screen.getByLabelText("Replace image 1"),
    png("replacement.png")
  )
  await user.click(
    screen.getByRole("button", { name: "Upload selected images" })
  )
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please sign in again."
  )
  expect(uploadProductImages).toHaveBeenCalledWith(
    expect.objectContaining({ replaceImageId: "0", files: [expect.any(File)] })
  )
  expect(screen.getByRole("img", { name: "Saved image 1" })).toHaveAttribute(
    "src",
    image("0").url
  )
  expect(
    screen.getByRole("img", { name: "replacement.png" })
  ).toBeInTheDocument()
})

it("shows partial create success, keeps the form, and finishes retry without creating another product", async () => {
  const user = userEvent.setup()
  vi.mocked(uploadProductImages)
    .mockRejectedValueOnce(new ApiError(400, ["Upload rejected"]))
    .mockResolvedValueOnce({
      data: [image("new")],
      product: { ...product, version: 2 },
    })
  renderWithQuery(<NewProduct />)
  await user.type(await screen.findByLabelText("Product Name"), "QA Mug")
  await user.type(screen.getByLabelText("SKU"), "QA-MUG")
  await user.click(screen.getByRole("combobox", { name: "Category" }))
  await user.click(await screen.findByRole("option", { name: "Electronics" }))
  await user.type(screen.getByLabelText("Selling Price (PKR)"), "10")
  await user.type(screen.getByLabelText("Stock Quantity"), "1")
  await user.upload(screen.getByLabelText("Add product images"), png("mug.png"))
  await user.click(screen.getByRole("button", { name: "Create Product" }))
  expect(
    await screen.findByText(new RegExp(`${product.id} has been created`))
  ).toBeInTheDocument()
  expect(screen.getByLabelText("Product Name")).toHaveValue("QA Mug")
  expect(screen.getByLabelText("Product Name")).toBeDisabled()
  expect(
    screen
      .getAllByRole("alert")
      .some((alert) =>
        alert.textContent?.includes("was created, but image uploading")
      )
  ).toBe(true)
  expect(push).not.toHaveBeenCalled()
  await user.click(screen.getByRole("button", { name: "Finish image upload" }))
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(`/dashboard/products/${product.id}`)
  )
  expect(createRequest).toHaveBeenCalledTimes(1)
})
