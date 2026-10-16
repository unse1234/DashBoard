import { z } from "zod"

import { formatInteger } from "@/utils/format-number"

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 120
const SKU_MAX_LENGTH = 64
const SUBTITLE_MAX_LENGTH = 160
const BRAND_MAX_LENGTH = 80
// The API's own bounds for the shop's pictures.
const IMAGE_REFERENCE_MAX_LENGTH = 500
const GALLERY_MAX_SIZE = 10
const DESCRIPTION_MAX_LENGTH = 2000
const PRICE_MAX = 1_000_000
const STOCK_MAX = 1_000_000

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a product name.")
  .min(
    NAME_MIN_LENGTH,
    `Product name must be at least ${NAME_MIN_LENGTH} characters.`
  )
  .max(
    NAME_MAX_LENGTH,
    `Product name must be ${NAME_MAX_LENGTH} characters or fewer.`
  )

const skuSchema = z
  .string()
  .trim()
  .min(1, "Enter a SKU.")
  .max(SKU_MAX_LENGTH, `SKU must be ${SKU_MAX_LENGTH} characters or fewer.`)
  .regex(/^\S+$/, "SKU can't contain spaces.")

/** Optional text: whitespace-only counts as empty, and empty becomes null. */
function optionalTextSchema(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
    .transform((value) => (value === "" ? null : value))
}

const IMAGE_REFERENCE_MESSAGE =
  "Use an http(s) address or a path on the shop that starts with “/”."

/**
 * Where a picture can be loaded from: an http(s) address, or a path on the
 * shop's own site. This repeats the API's rule so a mistake shows while typing;
 * the API's answer is the one that counts.
 */
function isImageReference(value: string) {
  if (value.length === 0 || value.length > IMAGE_REFERENCE_MAX_LENGTH) {
    return false
  }
  const hasUnsafeCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0)
    return (
      /\s/.test(character) || code < 0x20 || code === 0x7f || character === "\\"
    )
  })
  if (hasUnsafeCharacter) return false

  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.split("/").includes("..")
  }
  try {
    const url = new URL(value)
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname !== "" &&
      url.username === "" &&
      url.password === ""
    )
  } catch {
    return false
  }
}

const imageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isImageReference(value),
    IMAGE_REFERENCE_MESSAGE
  )
  .transform((value) => (value === "" ? null : value))

/** One address per line; blank lines are ignored. */
function toGalleryLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
}

const galleryUrlsSchema = z
  .string()
  .refine(
    (value) => toGalleryLines(value).length <= GALLERY_MAX_SIZE,
    `Add at most ${GALLERY_MAX_SIZE} more pictures.`
  )
  .refine(
    (value) => toGalleryLines(value).every(isImageReference),
    `Each line must be one address. ${IMAGE_REFERENCE_MESSAGE}`
  )
  .transform(toGalleryLines)

// The form works with what was typed, so the amounts arrive as text and leave
// as numbers once they are valid.
function priceAmountSchema(label: string) {
  return z.coerce
    .number<string>(`Enter a valid ${label.toLowerCase()}.`)
    .min(0, `${label} must not be negative.`)
    .max(PRICE_MAX, `${label} must be ${formatInteger(PRICE_MAX)} or less.`)
    .multipleOf(0.01, `${label} can have at most two decimal places.`)
}

const stockSchema = z
  .string()
  .trim()
  .min(1, "Enter the stock quantity.")
  .pipe(
    z.coerce
      .number<string>("Enter a valid stock quantity.")
      .int("Stock quantity must be a whole number.")
      .min(0, "Stock quantity must not be negative.")
      .max(
        STOCK_MAX,
        `Stock quantity must be ${formatInteger(STOCK_MAX)} or less.`
      )
  )

export const productFormSchema = z.object({
  name: nameSchema,
  sku: skuSchema,
  subtitle: optionalTextSchema("Subtitle", SUBTITLE_MAX_LENGTH),
  brand: optionalTextSchema("Brand", BRAND_MAX_LENGTH),
  description: optionalTextSchema("Description", DESCRIPTION_MAX_LENGTH),
  imageUrl: imageUrlSchema,
  galleryUrls: galleryUrlsSchema,
  categoryId: z.string().min(1, "Select a category."),
  status: z.enum(["active", "inactive"], "Select a status."),
  price: z
    .string()
    .trim()
    .min(1, "Enter a selling price.")
    .pipe(priceAmountSchema("Selling price")),
  costPrice: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(priceAmountSchema("Cost price").optional())
    .transform((value) => value ?? null),
  stock: stockSchema,
})
