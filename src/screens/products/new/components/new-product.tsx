"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { useCreateProductMutation } from "@/lib/products/product.mutations"
import { useCategoriesQuery } from "@/lib/products/product.queries"
import type { ProductFormValues } from "@/lib/products/product.schemas"
import { getProductRoute } from "@/lib/routes"
import { ProductForm } from "@/screens/products/components/product-form"
import { ProductFormSkeleton } from "@/screens/products/components/product-form-skeleton"

/** The empty form, once the categories it offers have loaded. */
export function NewProduct() {
  const router = useRouter()
  const { data: categories, error, refetch } = useCategoriesQuery()
  const { mutateAsync: createProduct } = useCreateProductMutation()

  async function handleSubmit(values: ProductFormValues) {
    const product = await createProduct(values)
    toast.success(`${product.name} was created.`)
    router.push(getProductRoute(product.id))
  }

  if (error) {
    return (
      <LoadError
        resourceName="the categories"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!categories) return <ProductFormSkeleton />

  return <ProductForm categories={categories} onSubmit={handleSubmit} />
}
