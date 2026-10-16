import { act, renderHook, waitFor } from "@testing-library/react"
import { useAuth } from "@/hooks/auth/use-auth"
import { useProductFormWorkflow } from "@/hooks/products/use-product-form-workflow"
import { productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import { ApiError } from "@/lib/api/api-error"
import {
  createProduct as createRequest,
  updateProduct,
  getProduct,
} from "@/services/products/product.api"
import {
  getProductImages,
  uploadProductImages,
  deleteProductImage,
  orderProductImages,
} from "@/services/products/product-images.api"
import { createProduct } from "@/test-utils/product-fixtures"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"
import type { Product } from "@/types/product.types"
import type { ProductImage } from "@/types/product-image.types"
import { productFormSchema } from "@/validations/product.schemas"

vi.mock("@/hooks/auth/use-auth")
vi.mock("@/services/products/product.api")
vi.mock("@/services/products/product-images.api")
const product = createProduct({ version: 1 })
const values = productFormSchema.parse({
  name: "Mug",
  sku: "MUG-1",
  subtitle: "",
  brand: "",
  description: "",
  imageUrl: "",
  galleryUrls: "",
  categoryId: "cat-home",
  status: "active",
  price: "10",
  costPrice: "",
  stock: "2",
})
const png = (name = "image.png") =>
  new File(["png"], name, { type: "image/png" })
const image = (id: string, position = 0): ProductImage => ({
  id,
  url: `http://localhost:3001/uploads/products/${id}.png`,
  isCover: position === 0,
  position,
})
const revoke = vi.fn<(url: string) => void>()
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(getProductImages).mockResolvedValue([])
  vi.mocked(getProduct).mockResolvedValue(product)
  vi.mocked(createRequest).mockResolvedValue(product)
  vi.mocked(updateProduct).mockResolvedValue({ ...product, version: 2 })
  let counter = 0
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => `blob:test-${++counter}`)
      static revokeObjectURL(url: string) {
        revoke(url)
      }
    }
  )
})
afterEach(() => vi.unstubAllGlobals())

function setup(existing?: Product, savedImages: ProductImage[] = []) {
  const client = createTestQueryClient()
  if (existing) {
    client.setQueryData(productKeys.detail(existing.id), existing)
    client.setQueryData(productKeys.images(existing.id), savedImages)
  }
  const rendered = renderHook(() => useProductFormWorkflow(existing), {
    wrapper: createQueryWrapper(client),
  })
  return { ...rendered, client }
}

it("creates once, keeps failed files, and retries uploading to the same product", async () => {
  vi.mocked(uploadProductImages)
    .mockRejectedValueOnce(new ApiError(400, ["Invalid contents"]))
    .mockResolvedValueOnce({
      data: [image("new")],
      product: { ...product, version: 2 },
    })
  const { result } = setup()
  act(() => result.current.editor.select([png()]))
  await act(async () => {
    await expect(result.current.submit(values)).rejects.toThrow(
      `${product.id} was created`
    )
  })
  expect(result.current.created?.id).toBe(product.id)
  expect(result.current.editor.pending).toHaveLength(1)
  await act(async () => {
    await result.current.submit(values)
  })
  expect(createRequest).toHaveBeenCalledTimes(1)
  expect(uploadProductImages).toHaveBeenCalledTimes(2)
  expect(
    vi
      .mocked(uploadProductImages)
      .mock.calls.every(([request]) => request.productId === product.id)
  ).toBe(true)
  expect(result.current.editor.pending).toHaveLength(0)
  expect(revoke).toHaveBeenCalledWith("blob:test-1")
})

it("creates without images and never sends a multipart request", async () => {
  const { result } = setup()
  await act(async () => {
    await result.current.submit(values)
  })
  expect(createRequest).toHaveBeenCalledTimes(1)
  expect(createRequest).toHaveBeenCalledWith(
    expect.not.objectContaining({ imageUrl: expect.anything() })
  )
  expect(uploadProductImages).not.toHaveBeenCalled()
})

it("removing pending files never deletes a saved image and revokes previews on removal and unmount", () => {
  const { result, unmount } = setup()
  act(() => result.current.editor.select([png("a.png"), png("b.png")]))
  act(() =>
    result.current.editor.discard([result.current.editor.pending[0].id])
  )
  expect(deleteProductImage).not.toHaveBeenCalled()
  expect(revoke).toHaveBeenCalledWith("blob:test-1")
  unmount()
  expect(revoke).toHaveBeenCalledWith("blob:test-2")
})

it("rejects invalid and excessive selections without losing valid selections", () => {
  const { result } = setup(
    product,
    Array.from({ length: 7 }, (_, i) => image(String(i), i))
  )
  act(() => result.current.editor.select([png()]))
  act(() => result.current.editor.select([png("extra.png")]))
  expect(result.current.editor.error).toMatch(/at most 8/)
  expect(result.current.editor.pending).toHaveLength(1)
  act(() =>
    result.current.editor.discard(
      result.current.editor.pending.map((item) => item.id)
    )
  )
  act(() =>
    result.current.editor.select([
      new File(["svg"], "x.svg", { type: "image/svg+xml" }),
    ])
  )
  expect(result.current.editor.error).toMatch(/JPEG, PNG, or WebP/)
  expect(result.current.editor.pending).toHaveLength(0)
})

it("replaces at eight images and retains the previous saved image when rejected", async () => {
  const saved = Array.from({ length: 8 }, (_, i) => image(String(i), i))
  vi.mocked(uploadProductImages).mockRejectedValue(
    new ApiError(400, ["Image does not belong to this product"])
  )
  const { result, client } = setup(product, saved)
  act(() => result.current.editor.select([png()], saved[0].id))
  await act(async () => {
    await expect(result.current.editor.uploadPending()).rejects.toThrow(
      /belong/
    )
  })
  expect(uploadProductImages).toHaveBeenCalledWith(
    expect.objectContaining({
      productId: product.id,
      replaceImageId: saved[0].id,
      files: [expect.any(File)],
    })
  )
  expect(client.getQueryData(productKeys.detail(product.id))).toEqual(product)
  expect(result.current.editor.pending).toHaveLength(1)
})

it("updates image/detail caches and invalidates lists, history, and public catalog after deletion", async () => {
  vi.mocked(deleteProductImage).mockResolvedValue({
    data: [image("b")],
    product: { ...product, version: 2 },
  })
  const { result, client } = setup(product, [image("a"), image("b", 1)])
  const invalidate = vi.spyOn(client, "invalidateQueries")
  await act(async () => {
    await result.current.editor.remove("a")
  })
  expect(deleteProductImage).toHaveBeenCalledWith(product.id, "a")
  expect(client.getQueryData(productKeys.images(product.id))).toEqual([
    image("b"),
  ])
  expect(client.getQueryData(productKeys.detail(product.id))).toMatchObject({
    version: 2,
  })
  const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
  expect(keys).toEqual(
    expect.arrayContaining([
      productKeys.lists(),
      productKeys.history(product.id),
      catalogKeys.all,
    ])
  )
})

it("selects cover/order with the current version and later saves details without overwriting images", async () => {
  const saved = [image("a"), image("b", 1)]
  vi.mocked(orderProductImages).mockResolvedValue({
    ...product,
    version: 2,
    imageUrl: saved[1].url,
    galleryUrls: [saved[0].url],
  })
  const { result } = setup(product, saved)
  await act(async () => {
    await result.current.editor.reorder([saved[1], saved[0]])
  })
  expect(orderProductImages).toHaveBeenCalledWith(product.id, 1, [
    saved[1],
    saved[0],
  ])
  expect(result.current.editor.images[0]).toMatchObject({
    id: "b",
    isCover: true,
    position: 0,
  })
  await act(async () => {
    await result.current.submit(values)
  })
  const request = vi.mocked(updateProduct).mock.calls[0]
  expect(request[1]).toBe(2)
  expect(request[2]).not.toHaveProperty("imageUrl")
  expect(request[2]).not.toHaveProperty("galleryUrls")
})

it("keeps optimistic concurrency when someone else's background refresh changes the product", async () => {
  const { result, client } = setup(product)
  act(() => {
    client.setQueryData(productKeys.detail(product.id), {
      ...product,
      version: 9,
    })
  })
  await act(async () => {
    await result.current.submit(values)
  })
  expect(updateProduct).toHaveBeenCalledWith(product.id, 1, expect.anything())
})

it("does not let an image version bump overwrite unrelated concurrent stock changes", async () => {
  vi.mocked(deleteProductImage).mockResolvedValue({
    data: [],
    product: { ...product, version: 3, stock: product.stock - 1 },
  })
  const { result } = setup(product, [image("a")])
  await act(async () => {
    await result.current.editor.remove("a")
  })
  await act(async () => {
    await expect(result.current.submit(values)).rejects.toMatchObject({
      status: 409,
    })
  })
  expect(updateProduct).not.toHaveBeenCalled()
})

it("does not replay a lost upload response when refreshed server images have changed", async () => {
  vi.mocked(uploadProductImages).mockRejectedValue(
    new ApiError(0, ["Connection lost"])
  )
  vi.mocked(getProductImages).mockResolvedValue([image("committed")])
  const { result } = setup(product)
  act(() => result.current.editor.select([png()]))
  await act(async () => {
    await expect(result.current.editor.uploadPending()).rejects.toThrow(
      /Review the saved images/
    )
  })
  expect(result.current.editor.pending).toHaveLength(0)
  expect(result.current.editor.images[0].id).toBe("committed")
  await act(async () => {
    await result.current.editor.uploadPending()
  })
  expect(uploadProductImages).toHaveBeenCalledTimes(1)
})

it("blocks retries when the server cannot be checked after a network interruption", async () => {
  vi.mocked(uploadProductImages).mockRejectedValue(
    new ApiError(0, ["Connection lost"])
  )
  vi.mocked(getProductImages).mockRejectedValue(new ApiError(0, ["Offline"]))
  const { result } = setup(product)
  act(() => result.current.editor.select([png()]))
  await act(async () => {
    await expect(result.current.editor.uploadPending()).rejects.toThrow(
      /Connection lost/
    )
  })
  expect(result.current.editor.needsRefresh).toBe(true)
  await act(async () => {
    await expect(result.current.editor.uploadPending()).rejects.toThrow(
      /Refresh server images/
    )
  })
  expect(uploadProductImages).toHaveBeenCalledTimes(1)
  vi.mocked(getProductImages).mockResolvedValue([])
  await act(async () => {
    await result.current.editor.refresh()
  })
  expect(result.current.editor.needsRefresh).toBe(false)
  expect(result.current.editor.pending).toHaveLength(1)
})

it("does not load private image metadata while unauthenticated", async () => {
  vi.mocked(useAuth).mockReturnValue({ status: "unauthenticated", user: null })
  const { result } = setup()
  await waitFor(() => expect(result.current.editor.images).toEqual([]))
  expect(getProductImages).not.toHaveBeenCalled()
})
