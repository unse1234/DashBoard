export const PRODUCT_IMAGE_LIMIT = 8
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"
const TYPES = new Set(PRODUCT_IMAGE_ACCEPT.split(","))

/** Browser feedback only: the API checks the actual image contents. */
export function validateProductImageFiles(
  files: File[],
  existingCount: number,
  pendingCount = 0,
  replacement = false
): string | null {
  if (files.length === 0) return "Select at least one image."
  if (replacement && files.length !== 1)
    return "Select exactly one replacement image."
  if (
    files.length > PRODUCT_IMAGE_LIMIT ||
    (!replacement &&
      existingCount + pendingCount + files.length > PRODUCT_IMAGE_LIMIT)
  )
    return "A product can have at most 8 images, including existing images."
  for (const file of files) {
    if (!TYPES.has(file.type))
      return `${file.name}: select a JPEG, PNG, or WebP image.`
    if (file.size === 0) return `${file.name}: the file is empty.`
    if (file.size > PRODUCT_IMAGE_MAX_BYTES)
      return `${file.name}: each image must be 5 MiB or smaller.`
  }
  return null
}
