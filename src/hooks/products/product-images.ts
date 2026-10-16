import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/auth/use-auth"
import { productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import { cacheChangedProduct } from "@/hooks/products/product.mutations"
import {
  deleteProductImage,
  getProductImages,
  orderProductImages,
  uploadProductImages,
} from "@/services/products/product-images.api"
import type {
  ProductImage,
  ProductImageMutationResult,
  UploadProductImagesRequest,
} from "@/types/product-image.types"

export function useProductImagesQuery(productId?: string) {
  const { status } = useAuth()
  return useQuery({
    queryKey: productKeys.images(productId ?? ""),
    queryFn: ({ signal }) => getProductImages(productId!, signal),
    enabled: Boolean(productId) && status === "authenticated",
  })
}

export function useProductImageMutations() {
  const client = useQueryClient()
  async function cacheResult(result: ProductImageMutationResult) {
    await Promise.all([
      client.cancelQueries({ queryKey: productKeys.detail(result.product.id) }),
      client.cancelQueries({ queryKey: productKeys.images(result.product.id) }),
    ])
    client.setQueryData(productKeys.images(result.product.id), result.data)
    cacheChangedProduct(client, result.product)
    // The storefront already uses React Query, with freshness/focus refetching.
    void client.invalidateQueries({ queryKey: catalogKeys.all })
  }
  const upload = useMutation({
    mutationFn: (request: UploadProductImagesRequest) =>
      uploadProductImages(request),
    retry: false,
    onSuccess: cacheResult,
  })
  const remove = useMutation({
    mutationFn: ({
      productId,
      imageId,
    }: {
      productId: string
      imageId: string
    }) => deleteProductImage(productId, imageId),
    retry: false,
    onSuccess: cacheResult,
  })
  const order = useMutation({
    mutationFn: async ({
      productId,
      version,
      images,
    }: {
      productId: string
      version: number
      images: ProductImage[]
    }) => {
      const product = await orderProductImages(productId, version, images)
      return {
        product,
        data: images.map((image, position) => ({
          ...image,
          position,
          isCover: position === 0,
        })),
      }
    },
    retry: false,
    onSuccess: cacheResult,
  })
  return { upload, remove, order }
}
