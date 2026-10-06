import { z } from "zod"

import { formatInteger } from "@/lib/format-number"

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 120
const SKU_MAX_LENGTH = 64
const BRAND_MAX_LENGTH = 80
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
  brand: optionalTextSchema("Brand", BRAND_MAX_LENGTH),
  description: optionalTextSchema("Description", DESCRIPTION_MAX_LENGTH),
  category: z.string().min(1, "Select a category."),
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

/** What the form fields hold while the user types. */
export type ProductFormInput = z.input<typeof productFormSchema>

/** The validated values, shaped like the product they create or update. */
export type ProductFormValues = z.output<typeof productFormSchema>
