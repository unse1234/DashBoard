import { apiClient } from "@/lib/api/axios"
import { toProduct } from "@/services/products/product.api"
import type { ApiProduct } from "@/types/product.types"
import type {
  ApiProductImageMutationResponse,
  ProductImage,
  ProductImagesResponse,
  UploadProductImagesRequest,
} from "@/types/product-image.types"

const productPath = (id: string) => `/products/${encodeURIComponent(id)}`
const imagesPath = (id: string) => `${productPath(id)}/images`

export async function getProductImages(
  productId: string,
  signal?: AbortSignal
) {
  const { data } = await apiClient.get<ProductImagesResponse>(
    imagesPath(productId),
    { signal }
  )
  return data.data
}

export async function uploadProductImages({
  productId,
  files,
  replaceImageId,
  onProgress,
}: UploadProductImagesRequest) {
  const form = new FormData()
  for (const file of files) form.append("images", file)
  const { data } = await apiClient.post<ApiProductImageMutationResponse>(
    imagesPath(productId),
    form,
    {
      // Remove any inherited JSON default. Axios/browser supplies the boundary.
      headers: { "Content-Type": false },
      params: replaceImageId ? { replaceImageId } : undefined,
      timeout: 120_000,
      onUploadProgress: ({ loaded, total }) => {
        if (total)
          onProgress?.(Math.min(100, Math.round((loaded / total) * 100)))
      },
    }
  )
  return { data: data.data, product: toProduct(data.product) }
}

export async function deleteProductImage(productId: string, imageId: string) {
  const { data } = await apiClient.delete<ApiProductImageMutationResponse>(
    `${imagesPath(productId)}/${encodeURIComponent(imageId)}`
  )
  return { data: data.data, product: toProduct(data.product) }
}

/** First image is the cover; the rest retain the requested display order. */
export async function orderProductImages(
  productId: string,
  version: number,
  images: ProductImage[]
) {
  const { data } = await apiClient.patch<ApiProduct>(productPath(productId), {
    version,
    imageUrl: images[0]?.url ?? null,
    galleryUrls: images.slice(1).map((image) => image.url),
  })
  return toProduct(data)
}
