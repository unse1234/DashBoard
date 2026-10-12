"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { isApiError } from "@/lib/api/api-error"
import { useUpdateProductMutation } from "@/hooks/products/product.mutations"
import {
  useCategoriesQuery,
  useProductQuery,
} from "@/hooks/products/product.queries"
import type { ProductFormValues } from "@/types/product.types";
import { getProductRoute } from "@/config/routes"
import { ProductForm } from "@/screens/products/components/product-form"
import { ProductFormSkeleton } from "@/screens/products/components/product-form-skeleton"
import { ProductNotFound } from "@/screens/products/details/components/product-not-found"

type EditProductProps = {
  productId: string
}

/** Loads one product and shows its form, or why there is none. */
export function EditProduct({ productId }: EditProductProps) {
  const router = useRouter()
  const productQuery = useProductQuery(productId)
  const categoriesQuery = useCategoriesQuery()
  const { mutateAsync: updateProduct } = useUpdateProductMutation()
  const { data: product, error } = productQuery

  // The API answers 404 for unknown and archived ids, and 400 for ids not
  // shaped like "PRD-1001".
  if (isApiError(error) && (error.status === 404 || error.status === 400)) {
    return <ProductNotFound />
  }

  const loadError = error ?? categoriesQuery.error
  if (loadError) {
    return (
      <LoadError
        resourceName="this product"
        error={loadError}
        onRetry={() => {
          void productQuery.refetch()
          void categoriesQuery.refetch()
        }}
      />
    )
  }

  const categories = categoriesQuery.data
  if (!product || !categories) return <ProductFormSkeleton />

  const handleSubmit = async (values: ProductFormValues) => {
    const saved = await updateProduct({
      productId: product.id,
      // The version the form was loaded from: the API refuses a save made on
      // top of a product that has changed since.
      version: product.version,
      values,
    })
    toast.success(`Changes to ${saved.name} were saved.`)
    router.push(getProductRoute(saved.id))
  }

  return (
    // Keyed by version, so reloading a product that changed gives the form its
    // new details instead of what was typed on the old ones.
    <ProductForm
      key={product.version}
      product={product}
      categories={categories}
      onSubmit={handleSubmit}
      onReload={() => void productQuery.refetch()}
    />
  )
}
