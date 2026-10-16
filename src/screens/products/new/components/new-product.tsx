"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { useProductFormWorkflow } from "@/hooks/products/use-product-form-workflow"
import { ProductImageEditor } from "@/screens/products/components/product-image-editor"
import { AuthFormMessage } from "@/components/auth/auth-form"
import { useCategoriesQuery } from "@/hooks/products/product.queries"
import type { ProductFormValues } from "@/types/product.types"
import { getProductRoute } from "@/config/routes"
import { ProductForm } from "@/screens/products/components/product-form"
import { ProductFormSkeleton } from "@/screens/products/components/product-form-skeleton"

/** The empty form, once the categories it offers have loaded. */
export function NewProduct() {
  const router = useRouter()
  const { data: categories, error, refetch } = useCategoriesQuery()
  const workflow = useProductFormWorkflow()

  async function handleSubmit(values: ProductFormValues) {
    const product = await workflow.submit(values)
    toast.success(`${product.name} was created.`)
    router.push(getProductRoute(product.id))
  }

  if (error && !categories) {
    return (
      <LoadError
        resourceName="the categories"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!categories) return <ProductFormSkeleton />

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <AuthFormMessage
          status="error"
          message="Categories could not be refreshed. Your form has been kept; try again shortly."
        />
      )}
      {workflow.created && (
        <AuthFormMessage
          status="success"
          message={`${workflow.created.id} has been created. Finish uploading images below, or remove the remaining selections to continue without them. Product details are already saved.`}
        />
      )}
      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        busy={workflow.editor.busy}
        detailsLocked={Boolean(workflow.created)}
        submitLabel={workflow.created ? "Finish image upload" : undefined}
        imageEditor={<ProductImageEditor editor={workflow.editor} deferred />}
      />
    </div>
  )
}
