"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { AuthFormMessage } from "@/components/auth/auth-form"
import { isApiError } from "@/lib/api/api-error"
import { useProductFormWorkflow } from "@/hooks/products/use-product-form-workflow"
import { ProductImageEditor } from "@/screens/products/components/product-image-editor"
import {
  useCategoriesQuery,
  useProductQuery,
} from "@/hooks/products/product.queries"
import type { ProductFormValues } from "@/types/product.types"
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
  const [formRevision, setFormRevision] = useState(0)
  const { data: product, error } = productQuery
  const workflow = useProductFormWorkflow(product)

  // The API answers 404 for unknown and archived ids, and 400 for ids not
  // shaped like "PRD-1001".
  if (
    !product &&
    isApiError(error) &&
    (error.status === 404 || error.status === 400)
  ) {
    return <ProductNotFound />
  }

  const loadError = error ?? categoriesQuery.error
  if (loadError && (!product || !categoriesQuery.data)) {
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
    const saved = await workflow.submit(values)
    toast.success(`Changes to ${saved.name} were saved.`)
    router.push(getProductRoute(saved.id))
  }

  return (
    <div className="flex flex-col gap-4">
      {loadError && (
        <AuthFormMessage
          status="error"
          message="The product could not be refreshed. Your form has been kept. Use Reload product if saving reports a conflict."
        />
      )}
      <ProductForm
        key={formRevision}
        product={product}
        categories={categories}
        onSubmit={handleSubmit}
        busy={workflow.editor.busy}
        imageEditor={<ProductImageEditor editor={workflow.editor} />}
        onReload={() => {
          void productQuery.refetch().then((result) => {
            if (result.data && !result.error) {
              workflow.acceptReload(result.data)
              setFormRevision((revision) => revision + 1)
            }
          })
        }}
      />
    </div>
  )
}
