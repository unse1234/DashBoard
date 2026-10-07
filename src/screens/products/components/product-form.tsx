"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

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
import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from "@/lib/products/product.constants"
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "@/lib/products/product.schemas"
import type { Product } from "@/lib/products/product.types"
import { getProductRoute, routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const emptyValues: ProductFormInput = {
  name: "",
  sku: "",
  brand: "",
  description: "",
  category: "",
  status: "active",
  price: "",
  costPrice: "",
  stock: "",
}

function getDefaultValues(product: Product): ProductFormInput {
  return {
    name: product.name,
    sku: product.sku,
    brand: product.brand ?? "",
    description: product.description ?? "",
    category: product.category,
    status: product.status,
    price: product.price.toFixed(2),
    costPrice: product.costPrice === null ? "" : product.costPrice.toFixed(2),
    stock: String(product.stock),
  }
}

type ProductFormProps = {
  /** The product to edit; leave out to create a new one. */
  product?: Product
  /** Called with the validated values. Until it is connected to an API, a valid submission is only acknowledged. */
  onSubmit?: (values: ProductFormValues) => void | Promise<void>
}

export function ProductForm({ product, onSubmit }: ProductFormProps) {
  const isEditing = product !== undefined
  const submitLabel = isEditing ? "Update Product" : "Create Product"
  const submittingLabel = isEditing ? "Updating…" : "Creating…"
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? getDefaultValues(product) : emptyValues,
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: ProductFormValues) {
    if (onSubmit) {
      await onSubmit(values)
      return
    }

    toast.info("Nothing was saved", {
      description: "The details are valid, but saving isn't connected yet.",
    })
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset
        disabled={isSubmitting}
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
              name="category"
              render={({ field }) => (
                <FormSelectField
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  label="Category"
                  options={PRODUCT_CATEGORY_OPTIONS}
                  placeholder="Select a category"
                  required
                  disabled={isSubmitting}
                  error={errors.category?.message}
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
              label="Selling Price (USD)"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              required
              error={errors.price?.message}
              {...form.register("price")}
            />
            <FormField
              label="Cost Price (USD, optional)"
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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href={isEditing ? getProductRoute(product.id) : routes.products}
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
}

function ProductFormSection({
  title,
  description,
  children,
}: ProductFormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="@container">
        <FieldGroup>{children}</FieldGroup>
      </CardContent>
    </Card>
  )
}
