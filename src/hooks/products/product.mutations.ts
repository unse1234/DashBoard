import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import {
  archiveProducts,
  createProduct,
  updateProduct,
} from "@/services/products/product.api"
import { productKeys } from "@/hooks/products/product.keys"
import type { ProductWriteValues, Product } from "@/types/product.types"

// A product appears on some page of the list, in its details, and in its edit
// history. Any change refetches the lists (not awaited: the screen keeps its
// rows, dimmed, until the fresh page arrives) and the history; the detail entry
// is replaced outright with what the API returned, version included, so the
// next edit starts from the right one.

function invalidateLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
}

export function cacheChangedProduct(queryClient: QueryClient, product: Product) {
  queryClient.setQueryData(productKeys.detail(product.id), product)
  void queryClient.invalidateQueries({
    queryKey: productKeys.history(product.id),
  })
  invalidateLists(queryClient)
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProductWriteValues) => createProduct(values),
    onSuccess: (product) => cacheChangedProduct(queryClient, product),
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      version,
      values,
    }: {
      productId: string
      /** The version the values were edited from. */
      version: number
      values: ProductWriteValues
    }) => updateProduct(productId, version, values),
    onSuccess: (product) => cacheChangedProduct(queryClient, product),
  })
}

/** "Delete" in the dashboard: the products are archived, not removed. */
export function useArchiveProductsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds: string[]) => archiveProducts(productIds),
    onSuccess: (_archived, productIds) => {
      // Nothing left to show for these: a later visit must hit the API and get its 404.
      for (const productId of productIds) {
        queryClient.removeQueries({ queryKey: productKeys.detail(productId) })
        queryClient.removeQueries({ queryKey: productKeys.history(productId) })
        queryClient.removeQueries({ queryKey: productKeys.images(productId) })
      }
      invalidateLists(queryClient)
    },
  })
}
