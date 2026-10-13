"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { LockKeyholeIcon } from "lucide-react"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { demoCheckoutAddress } from "@/mocks/storefront/checkout-address-demo"
import type { CheckoutShippingAddress } from "@/types/storefront/checkout-draft.types"
import { checkoutAddressSchema } from "@/validations/storefront/checkout-address.schema"

import styles from "./shipping-address.module.css"

export function ShippingAddressScreen() {
  const router = useRouter()
  const { draft, setShippingAddress } = useCheckoutDraft()
  const form = useForm<CheckoutShippingAddress>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: draft.shippingAddress ?? demoCheckoutAddress,
  })
  const { errors, isSubmitting } = form.formState

  function submit(address: CheckoutShippingAddress) {
    setShippingAddress(address)
    router.push(routes.checkout)
  }

  return (
    <section className={styles.page} aria-labelledby="shipping-address-heading">
      <h1 id="shipping-address-heading" className="sr-only">Shipping address</h1>
      <form className={styles.panel} onSubmit={form.handleSubmit(submit)} noValidate>
        <FieldGroup className={styles.fields}>
          <FormField label="Shipping Name" autoComplete="shipping name" required maxLength={120} error={errors.shippingName?.message} {...form.register("shippingName")} />
          <FormField label="Street Name" autoComplete="shipping address-line1" required maxLength={120} error={errors.streetName?.message} {...form.register("streetName")} />
          <FormField label="City" autoComplete="shipping address-level2" required maxLength={120} error={errors.city?.message} {...form.register("city")} />
          <FormField label="State / Province" autoComplete="shipping address-level1" required maxLength={120} error={errors.stateProvince?.message} {...form.register("stateProvince")} />
          <FormField label="Country" autoComplete="shipping country-name" required maxLength={120} error={errors.country?.message} {...form.register("country")} />
        </FieldGroup>
        <Controller name="isDefault" control={form.control} render={({ field }) => (
          <Field orientation="horizontal" className={styles.preference}>
            <Checkbox id="default-shipping-address" name={field.name} ref={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
            <FieldLabel htmlFor="default-shipping-address">Save this as your default address</FieldLabel>
          </Field>
        )} />
        <Button type="submit" className={styles.submit} disabled={isSubmitting}>Add Address</Button>
        <div className={styles.footer}>
          <Link href={routes.checkout}>Back</Link>
          <span className={styles.lock} title="Demo checkout interface">
            <LockKeyholeIcon aria-hidden="true" />
            Secure Connection
          </span>
        </div>
      </form>
    </section>
  )
}
