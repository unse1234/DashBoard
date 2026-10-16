"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { AuthFormMessage } from "@/components/auth/auth-form"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { FormTextareaField } from "@/components/shared/form-textarea-field"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { describeApiError, isApiError } from "@/lib/api/api-error"
import {
  PRODUCT_STATUS_OPTIONS,
  SKU_TAKEN_MESSAGE,
} from "@/constants/product.constants"
import { productFormSchema } from "@/validations/product.schemas"
import type {
  ProductFormInput,
  ProductFormValues,
  Category,
  Product,
} from "@/types/product.types"
import { getProductRoute, routes } from "@/config/routes"
import { cn } from "@/utils/cn"

const emptyValues: ProductFormInput = {
  name: "",
  sku: "",
  subtitle: "",
  brand: "",
  description: "",
  imageUrl: "",
  galleryUrls: "",
  categoryId: "",
  status: "active",
  price: "",
  costPrice: "",
  stock: "",
}

function getDefaultValues(product: Product): ProductFormInput {
  return {
    name: product.name,
    sku: product.sku,
    subtitle: product.subtitle ?? "",
    brand: product.brand ?? "",
    description: product.description ?? "",
    imageUrl: "",
    galleryUrls: "",
    categoryId: product.categoryId,
    status: product.status,
    price: product.price.toFixed(2),
    costPrice: product.costPrice === null ? "" : product.costPrice.toFixed(2),
    stock: String(product.stock),
  }
}

/** The error type of a save that was refused because the product had changed. */
const STALE_ERROR_TYPE = "stale"

type ProductFormProps = {
  /** The product to edit; leave out to create a new one. */
  product?: Product
  /** The options of the category field. */
  categories: Category[]
  /**
   * Saves the validated values. If it rejects, the form shows why: a taken SKU
   * on the SKU field, anything else above the form.
   */
  onSubmit: (values: ProductFormValues) => Promise<void>
  /**
   * Loads the product's current details again. Offered when a save was refused
   * because someone else changed the product; the form then starts over from
   * what was loaded.
   */
  onReload?: () => void
  imageEditor?: ReactNode
  busy?: boolean
  detailsLocked?: boolean
  submitLabel?: string
}

export function ProductForm({
  product,
  categories,
  onSubmit,
  onReload,
  imageEditor,
  busy = false,
  detailsLocked = false,
  submitLabel: customSubmitLabel,
}: ProductFormProps) {
  const isEditing = product !== undefined
  const submitLabel =
    customSubmitLabel ?? (isEditing ? "Update Product" : "Create Product")
  const submittingLabel = isEditing ? "Updating…" : "Creating…"
  const categoryOptions = categories.map(({ id, name }) => ({
    value: id,
    label: name,
  }))
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? getDefaultValues(product) : emptyValues,
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: ProductFormValues) {
    try {
      await onSubmit(values)
    } catch (error) {
      if (!isApiError(error) || error.status !== 409) {
        form.setError("root", { message: describeApiError(error) })
      } else if (error.message === SKU_TAKEN_MESSAGE) {
        form.setError(
          "sku",
          { message: "Another product already uses this SKU." },
          { shouldFocus: true }
        )
      } else {
        // The only other conflict is a product that changed since it was loaded.
        form.setError("root", {
          type: STALE_ERROR_TYPE,
          message: describeApiError(error),
        })
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset
        disabled={isSubmitting || busy}
        className="flex min-w-0 flex-col gap-4 md:gap-6"
      >
        {errors.root && (
          <div className="flex flex-col items-start gap-2">
            <div className="w-full">
              <AuthFormMessage status="error" message={errors.root.message} />
            </div>
            {errors.root.type === STALE_ERROR_TYPE && onReload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReload}
              >
                Reload product
              </Button>
            )}
          </div>
        )}

        <fieldset
          disabled={detailsLocked}
          className="flex min-w-0 flex-col gap-4 md:gap-6"
        >
          <ProductFormSection
            title="Basic information"
            description="What the product is called and how it is identified."
          >
            <FormField
              label="Product Name"
              autoComplete="off"
              required
              error={errors.name?.message}
              {...form.register("name")}
            />
            <div className="grid gap-5 @lg:grid-cols-2">
              <FormField
                label="SKU"
                autoComplete="off"
                required
                error={errors.sku?.message}
                {...form.register("sku")}
              />
              <FormField
                label="Brand (optional)"
                autoComplete="off"
                error={errors.brand?.message}
                {...form.register("brand")}
              />
            </div>
            <FormTextareaField
              label="Description (optional)"
              rows={4}
              error={errors.description?.message}
              {...form.register("description")}
            />
          </ProductFormSection>

          <ProductFormSection
            title="Categorization"
            description="Where the product is listed and whether it is available."
          >
            <div className="grid gap-5 @lg:grid-cols-2">
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormSelectField
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    label="Category"
                    options={categoryOptions}
                    placeholder="Select a category"
                    required
                    disabled={isSubmitting}
                    error={errors.categoryId?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormSelectField
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    label="Status"
                    options={PRODUCT_STATUS_OPTIONS}
                    required
                    disabled={isSubmitting}
                    error={errors.status?.message}
                  />
                )}
              />
            </div>
          </ProductFormSection>

          <ProductFormSection
            title="Pricing and inventory"
            description="What the product sells for and how many are in stock."
          >
            <div className="grid gap-5 @2xl:grid-cols-3">
              <FormField
                label="Selling Price (PKR)"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                required
                error={errors.price?.message}
                {...form.register("price")}
              />
              <FormField
                label="Cost Price (PKR, optional)"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                error={errors.costPrice?.message}
                {...form.register("costPrice")}
              />
              <FormField
                label="Stock Quantity"
                inputMode="numeric"
                placeholder="0"
                autoComplete="off"
                required
                error={errors.stock?.message}
                {...form.register("stock")}
              />
            </div>
          </ProductFormSection>

          <ProductFormSection
            title="Online shop listing"
            description="How the product is described in the shop."
          >
            <FormField
              label="Subtitle (optional)"
              autoComplete="off"
              description="A short line shown under the name."
              error={errors.subtitle?.message}
              {...form.register("subtitle")}
            />
          </ProductFormSection>
        </fieldset>

        {imageEditor && (
          <ProductFormSection
            title="Product images"
            description="Upload pictures, choose a cover, and set the display order."
            containFields={false}
          >
            {imageEditor}
          </ProductFormSection>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href={isEditing ? getProductRoute(product.id) : routes.products}
            aria-disabled={isSubmitting || busy}
            tabIndex={isSubmitting || busy ? -1 : undefined}
            onClick={(event) => {
              if (isSubmitting || busy) event.preventDefault()
            }}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
          <Button type="submit">
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

type ProductFormSectionProps = {
  title: string
  description: string
  children: ReactNode
  /** File fieldsets use their own grid and do not need nested query containers. */
  containFields?: boolean
}

function ProductFormSection({
  title,
  description,
  children,
  containFields = true,
}: ProductFormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={containFields ? "@container" : undefined}>
        <FieldGroup
          style={containFields ? undefined : { containerType: "normal" }}
        >
          {children}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
