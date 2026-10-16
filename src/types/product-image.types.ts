import type { ApiProduct, Product } from "@/types/product.types"

export type ProductImage = {
  id: string
  url: string
  isCover: boolean
  position: number
}

export type ProductImagesResponse = { data: ProductImage[] }
export type ApiProductImageMutationResponse = ProductImagesResponse & {
  product: ApiProduct
}
export type ProductImageMutationResult = ProductImagesResponse & {
  product: Product
}

export type UploadProductImagesRequest = {
  productId: string
  files: File[]
  replaceImageId?: string
  onProgress?: (percent: number) => void
}

export type PendingProductImage = {
  id: string
  file: File
  previewUrl: string
  replaceImageId?: string
}
