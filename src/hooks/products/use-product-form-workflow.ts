import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, describeApiError } from "@/lib/api/api-error"
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/hooks/products/product.mutations"
import { useProductImageEditor } from "@/hooks/products/use-product-image-editor"
import { productKeys } from "@/hooks/products/product.keys"
import type { Product, ProductFormValues } from "@/types/product.types"

const IMAGE_WRITE_FIELDS = new Set([
  "imageUrl",
  "galleryUrls",
  "version",
  "updatedAt",
])

function sameDetails(before: Product, after: Product) {
  return Object.entries(before).every(
    ([key, value]) =>
      IMAGE_WRITE_FIELDS.has(key) || after[key as keyof Product] === value
  )
}

/** Retains the successful create across upload retries for the life of this form. */
export function useProductFormWorkflow(product?: Product) {
  const client = useQueryClient()
  const create = useCreateProductMutation()
  const update = useUpdateProductMutation()
  const createdRef = useRef<Product | null>(null)
  const [created, setCreated] = useState<Product | null>(null)
  const editor = useProductImageEditor(product?.id ?? created?.id)
  const submitting = useRef(false)
  const original = useRef<Product | null>(null)
  useEffect(() => {
    if (product && original.current?.id !== product.id)
      original.current = product
  }, [product])

  async function submit(values: ProductFormValues) {
    if (submitting.current)
      throw new ApiError(400, ["The product is already being saved."])
    submitting.current = true
    try {
      // Images have their own endpoints. A stale form must never restore deleted
      // URLs or overwrite images uploaded since the form was opened.
      const { imageUrl: _cover, galleryUrls: _gallery, ...details } = values
      void _cover
      void _gallery
      let saved: Product
      if (product) {
        const baseline = original.current ?? product
        const imageWrite = editor.latestWrittenProduct()
        if (
          imageWrite &&
          imageWrite.version > baseline.version &&
          !sameDetails(baseline, imageWrite)
        ) {
          throw new ApiError(409, [
            "This product was changed by someone else. Reload it and try again.",
          ])
        }
        const version = Math.max(baseline.version, imageWrite?.version ?? 0)
        saved = await update.mutateAsync({
          productId: product.id,
          version,
          values: details,
        })
        original.current = saved
      } else {
        saved = createdRef.current ?? (await create.mutateAsync(details))
        createdRef.current = saved
        setCreated(saved)
      }
      try {
        await editor.uploadPending(saved.id)
      } catch (failure) {
        throw new ApiError(400, [
          `${saved.id} was ${product ? "saved" : "created"}, but image uploading did not finish. ${describeApiError(failure)} Your selected files are kept where safe. Retry to upload the remaining images to this same product.`,
        ])
      }
      return client.getQueryData<Product>(productKeys.detail(saved.id)) ?? saved
    } finally {
      submitting.current = false
    }
  }

  return {
    editor,
    created,
    submit,
    acceptReload: (current: Product) => {
      original.current = current
    },
  }
}
