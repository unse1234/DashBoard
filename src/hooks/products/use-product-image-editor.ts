import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, describeApiError, isApiError } from "@/lib/api/api-error"
import {
  useProductImageMutations,
  useProductImagesQuery,
} from "@/hooks/products/product-images"
import { productKeys } from "@/hooks/products/product.keys"
import { cacheChangedProduct } from "@/hooks/products/product.mutations"
import { getProductImages } from "@/services/products/product-images.api"
import { getProduct } from "@/services/products/product.api"
import type {
  PendingProductImage,
  ProductImage,
} from "@/types/product-image.types"
import type { Product } from "@/types/product.types"
import { validateProductImageFiles } from "@/validations/product-images"

const signature = (images: ProductImage[]) =>
  JSON.stringify(images.map(({ id, url }) => [id, url]))

export function useProductImageEditor(productId?: string) {
  const client = useQueryClient()
  const query = useProductImagesQuery(productId)
  const mutations = useProductImageMutations()
  const [pending, setPending] = useState<PendingProductImage[]>([])
  const pendingRef = useRef(pending)
  const objectUrls = useRef(new Set<string>())
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const uncertain = useRef<{
    productId: string
    before: string
    ids: string[]
  } | null>(null)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const writtenProduct = useRef<Product | null>(null)
  const images = query.data ?? []

  useEffect(() => {
    const urls = objectUrls.current
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  function changePending(next: PendingProductImage[]) {
    const keep = new Set(next.map((item) => item.previewUrl))
    for (const url of objectUrls.current) {
      if (!keep.has(url)) {
        URL.revokeObjectURL(url)
        objectUrls.current.delete(url)
      }
    }
    pendingRef.current = next
    setPending(next)
  }

  function discard(ids: string[]) {
    changePending(pendingRef.current.filter((item) => !ids.includes(item.id)))
  }

  function select(files: File[], replaceImageId?: string) {
    if (locked.current || needsRefresh) return
    const additions = pendingRef.current.filter(
      (item) => !item.replaceImageId
    ).length
    const message = validateProductImageFiles(
      files,
      images.length,
      additions,
      Boolean(replaceImageId)
    )
    setError(message)
    if (message) return
    const next = replaceImageId
      ? pendingRef.current.filter(
          (item) => item.replaceImageId !== replaceImageId
        )
      : pendingRef.current
    changePending([
      ...next,
      ...files.map((file) => {
        const previewUrl = URL.createObjectURL(file)
        objectUrls.current.add(previewUrl)
        return { id: crypto.randomUUID(), file, previewUrl, replaceImageId }
      }),
    ])
  }

  async function refresh(id = productId) {
    if (!id) return
    await client.cancelQueries({ queryKey: productKeys.images(id) })
    const [currentImages, product] = await Promise.all([
      client.fetchQuery({
        queryKey: productKeys.images(id),
        queryFn: () => getProductImages(id),
        staleTime: 0,
        retry: false,
      }),
      getProduct(id),
    ])
    cacheChangedProduct(client, product)
    writtenProduct.current = product
    if (uncertain.current) {
      if (signature(currentImages) !== uncertain.current.before) {
        // The response may have been lost after commit. Do not replay that batch.
        discard(uncertain.current.ids)
        setError(
          "The server image list changed during the interrupted upload. Review the saved images and select any missing files again."
        )
      }
      uncertain.current = null
      setNeedsRefresh(false)
    }
    return currentImages
  }

  async function run<T>(operation: () => Promise<T>): Promise<T> {
    if (locked.current)
      throw new ApiError(400, [
        "Wait for the current image operation to finish.",
      ])
    locked.current = true
    setBusy(true)
    setError(null)
    try {
      return await operation()
    } catch (failure) {
      setError(describeApiError(failure))
      throw failure
    } finally {
      locked.current = false
      setBusy(false)
      setProgress(null)
    }
  }

  async function uploadPending(id = productId) {
    if (!id || pendingRef.current.length === 0) return
    return run(async () => {
      if (uncertain.current)
        throw new ApiError(400, [
          "Refresh server images before retrying an interrupted upload.",
        ])
      const additions = pendingRef.current.filter(
        (item) => !item.replaceImageId
      )
      const replacements = pendingRef.current.filter(
        (item) => item.replaceImageId
      )
      const batches = [
        ...(additions.length ? [additions] : []),
        ...replacements.map((item) => [item]),
      ]
      for (const batch of batches) {
        const before =
          client.getQueryData<ProductImage[]>(productKeys.images(id)) ?? []
        const validation = validateProductImageFiles(
          batch.map((item) => item.file),
          before.length,
          0,
          Boolean(batch[0].replaceImageId)
        )
        if (validation) throw new ApiError(400, [validation])
        setProgress(0)
        try {
          const result = await mutations.upload.mutateAsync({
            productId: id,
            files: batch.map((item) => item.file),
            replaceImageId: batch[0].replaceImageId,
            onProgress: setProgress,
          })
          writtenProduct.current = result.product
          discard(batch.map((item) => item.id))
        } catch (failure) {
          if (
            !isApiError(failure) ||
            failure.isNetworkError ||
            failure.status >= 500
          ) {
            uncertain.current = {
              productId: id,
              before: signature(before),
              ids: batch.map((item) => item.id),
            }
            setNeedsRefresh(true)
            try {
              await refresh(id)
            } catch {
              /* Keep retry blocked until the server can be checked. */
            }
            if (
              !uncertain.current &&
              signature(
                client.getQueryData<ProductImage[]>(productKeys.images(id)) ??
                  []
              ) !== signature(before)
            ) {
              throw new ApiError(400, [
                "The upload response was interrupted. Review the saved images; select any missing files again.",
              ])
            }
          } else {
            // Count/ownership/version/auth errors must remain visible; no automatic retry.
            void client.invalidateQueries({ queryKey: productKeys.images(id) })
          }
          throw failure
        }
      }
    })
  }

  async function remove(imageId: string) {
    if (!productId) return
    await run(async () => {
      const result = await mutations.remove.mutateAsync({ productId, imageId })
      writtenProduct.current = result.product
      discard(
        pendingRef.current
          .filter((item) => item.replaceImageId === imageId)
          .map((item) => item.id)
      )
    })
  }

  async function reorder(next: ProductImage[]) {
    if (!productId) return
    await run(async () => {
      const product = client.getQueryData<Product>(
        productKeys.detail(productId)
      )
      if (!product)
        throw new ApiError(400, [
          "Reload the product before changing image order.",
        ])
      const result = await mutations.order.mutateAsync({
        productId,
        version: product.version,
        images: next,
      })
      writtenProduct.current = result.product
    })
  }

  function movePending(id: string, offset: number) {
    const next = [...pendingRef.current]
    const from = next.findIndex((item) => item.id === id)
    const to = from + offset
    if (from < 0 || to < 0 || to >= next.length) return
    ;[next[from], next[to]] = [next[to], next[from]]
    changePending(next)
  }

  return {
    images,
    pending,
    busy,
    progress,
    error: error ?? (query.error ? describeApiError(query.error) : null),
    loading: Boolean(productId) && !query.data && !query.error,
    unavailable: Boolean(productId) && !query.data,
    needsRefresh,
    select,
    discard,
    movePending,
    uploadPending,
    remove,
    reorder,
    latestWrittenProduct: () => writtenProduct.current,
    refresh: () =>
      run(() => refresh(uncertain.current?.productId ?? productId)),
  }
}

export type ProductImageEditorController = ReturnType<
  typeof useProductImageEditor
>
