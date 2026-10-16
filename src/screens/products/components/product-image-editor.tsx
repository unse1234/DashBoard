"use client"

import { useId, useState } from "react"
import { ProductImage } from "@/components/storefront/product-image"
import { AuthFormMessage } from "@/components/auth/auth-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { ProductImageEditorController } from "@/hooks/products/use-product-image-editor"
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_LIMIT,
} from "@/validations/product-images"

type Props = { editor: ProductImageEditorController; deferred?: boolean }

export function ProductImageEditor({ editor, deferred = false }: Props) {
  const prefix = useId()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const additions = editor.pending.filter((item) => !item.replaceImageId)
  const total = editor.images.length + additions.length
  const act = (operation: Promise<unknown>) => {
    void operation.catch(() => {
      /* The hook presents the API error. */
    })
  }

  return (
    <fieldset
      disabled={editor.busy || editor.loading}
      className="flex min-w-0 flex-col gap-4"
      aria-label="Product images"
    >
      <FieldGroup style={{ containerType: "normal" }}>
        <Field>
          <FieldLabel htmlFor={`${prefix}-files`}>
            Add product images
          </FieldLabel>
          <Input
            id={`${prefix}-files`}
            type="file"
            accept={PRODUCT_IMAGE_ACCEPT}
            multiple
            disabled={
              editor.unavailable ||
              editor.needsRefresh ||
              total >= PRODUCT_IMAGE_LIMIT
            }
            onChange={(event) => {
              editor.select(Array.from(event.target.files ?? []))
              event.target.value = ""
            }}
          />
          <FieldDescription>
            JPEG, PNG, or WebP. Maximum 5 MiB per image and 8 images per
            product, including existing images.
            {deferred
              ? " Images upload after the product is saved."
              : " Image changes are saved separately from product details."}
          </FieldDescription>
        </Field>
      </FieldGroup>
      <p className="text-sm text-muted-foreground" role="status">
        {total} of 8 images
        {editor.pending.length ? ` · ${editor.pending.length} selected` : ""}
      </p>
      {editor.loading && (
        <p className="flex items-center gap-2 text-sm">
          <Spinner />
          Loading images…
        </p>
      )}
      {editor.error && (
        <AuthFormMessage status="error" message={editor.error} />
      )}
      {(editor.unavailable || editor.error || editor.needsRefresh) &&
        !editor.loading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => act(editor.refresh())}
          >
            Refresh server images
          </Button>
        )}
      {editor.images.length > 0 && (
        <ol
          aria-label="Saved product images"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
        >
          {editor.images.map((image, index) => (
            <li
              key={image.id}
              className="flex min-w-0 flex-col gap-2 rounded-lg border p-2"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <ProductImage
                  image={{ url: image.url, alt: `Saved image ${index + 1}` }}
                  sizes="(max-width: 640px) 40vw, 180px"
                />
              </div>
              <Badge variant={image.isCover ? "default" : "secondary"}>
                {image.isCover ? "Cover" : `Image ${index + 1}`}
              </Badge>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={image.isCover}
                  onClick={() =>
                    act(
                      editor.reorder([
                        image,
                        ...editor.images.filter((item) => item.id !== image.id),
                      ])
                    )
                  }
                  aria-label={`Make image ${index + 1} cover`}
                >
                  Set cover
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={index === 0}
                  aria-label={`Move image ${index + 1} earlier`}
                  onClick={() => {
                    const next = [...editor.images]
                    ;[next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ]
                    act(editor.reorder(next))
                  }}
                >
                  Earlier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={index === editor.images.length - 1}
                  aria-label={`Move image ${index + 1} later`}
                  onClick={() => {
                    const next = [...editor.images]
                    ;[next[index], next[index + 1]] = [
                      next[index + 1],
                      next[index],
                    ]
                    act(editor.reorder(next))
                  }}
                >
                  Later
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor={`${prefix}-replace-${index}`}>
                  Replace image {index + 1}
                </FieldLabel>
                <Input
                  id={`${prefix}-replace-${index}`}
                  type="file"
                  accept={PRODUCT_IMAGE_ACCEPT}
                  disabled={editor.needsRefresh}
                  onChange={(event) => {
                    editor.select(
                      Array.from(event.target.files ?? []),
                      image.id
                    )
                    event.target.value = ""
                  }}
                />
              </Field>
              {confirmDelete === image.id ? (
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    aria-label={`Confirm delete image ${index + 1}`}
                    onClick={() => {
                      setConfirmDelete(null)
                      act(editor.remove(image.id))
                    }}
                  >
                    Confirm delete
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Keep image
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setConfirmDelete(image.id)}
                  aria-label={`Delete saved image ${index + 1}`}
                >
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
      {editor.pending.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Selected files are not saved yet. Replacements keep their current
            slot; the first new image is the cover when no images exist.
          </p>
          <ol
            aria-label="Pending product images"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          >
            {editor.pending.map((item, index) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col gap-2 rounded-lg border p-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <ProductImage
                    image={{ url: item.previewUrl, alt: item.file.name }}
                    sizes="(max-width: 640px) 40vw, 180px"
                  />
                </div>
                <p className="truncate text-sm" title={item.file.name}>
                  {item.file.name}
                </p>
                <Badge variant="secondary">
                  {item.replaceImageId
                    ? `Replaces image ${editor.images.findIndex((image) => image.id === item.replaceImageId) + 1}`
                    : editor.images.length === 0 && additions[0]?.id === item.id
                      ? "Pending cover"
                      : "Pending"}
                </Badge>
                {!item.replaceImageId && (
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => editor.movePending(item.id, -1)}
                      aria-label={`Move selected ${item.file.name} earlier`}
                    >
                      Earlier
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={index === editor.pending.length - 1}
                      onClick={() => editor.movePending(item.id, 1)}
                      aria-label={`Move selected ${item.file.name} later`}
                    >
                      Later
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => editor.discard([item.id])}
                  aria-label={`Remove selected ${item.file.name}`}
                >
                  Remove selection
                </Button>
              </li>
            ))}
          </ol>
          {!deferred && (
            <Button
              type="button"
              disabled={editor.needsRefresh || editor.unavailable}
              onClick={() => act(editor.uploadPending())}
            >
              Upload selected images
            </Button>
          )}
        </>
      )}
      {editor.busy && (
        <div className="flex flex-col gap-2" role="status">
          <p className="flex items-center gap-2 text-sm">
            <Spinner />
            {editor.progress === null
              ? "Saving image changes…"
              : editor.progress === 100
                ? "Processing images…"
                : `Uploading images… ${editor.progress}%`}
          </p>
          {editor.progress !== null && (
            <Progress
              value={editor.progress}
              aria-label="Image upload progress"
            />
          )}
        </div>
      )}
    </fieldset>
  )
}
