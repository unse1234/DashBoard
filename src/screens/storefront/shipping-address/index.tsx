"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field"
import {
  CHECKOUT_LIMITS,
  DELIVERY_COUNTRY_NAME,
} from "@/constants/storefront.constants"
import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import {
  checkoutDetailsSchema,
  type CheckoutDetailsFormValues,
} from "@/validations/storefront/checkout-details.schema"

import styles from "./shipping-address.module.css"

/** The draft as the form's flat fields; empty before anything was entered. */
function useFormDefaults(): CheckoutDetailsFormValues {
  const { draft } = useCheckoutDraft()
  return {
    name: draft.contact?.name ?? "",
    email: draft.contact?.email ?? "",
    phone: draft.contact?.phone ?? "",
    recipientName: draft.shippingAddress?.recipientName ?? "",
    addressLine1: draft.shippingAddress?.addressLine1 ?? "",
    addressLine2: draft.shippingAddress?.addressLine2 ?? "",
    city: draft.shippingAddress?.city ?? "",
    region: draft.shippingAddress?.region ?? "",
    postalCode: draft.shippingAddress?.postalCode ?? "",
  }
}

/**
 * Who is buying and where the order goes. Delivery is to Pakistan only, so the
 * country is shown and not chosen. The API validates all of this again; what is
 * checked here is feedback while typing.
 */
export function ShippingAddressScreen() {
  const router = useRouter()
  const { setDetails } = useCheckoutDraft()
  const form = useForm<CheckoutDetailsFormValues>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: useFormDefaults(),
  })
  const { errors, isSubmitting } = form.formState

  function submit(values: CheckoutDetailsFormValues) {
    setDetails({
      contact: { name: values.name, email: values.email, phone: values.phone },
      shippingAddress: {
        // Left blank, the order goes to the buyer.
        recipientName: values.recipientName || values.name,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        region: values.region,
        postalCode: values.postalCode,
      },
    })
    router.push(routes.checkout)
  }

  return (
    <section className={styles.page} aria-labelledby="shipping-address-heading">
      <h1 id="shipping-address-heading" className="sr-only">
        Delivery details
      </h1>
      <form
        className={styles.panel}
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <FieldSet>
          <FieldLegend className={styles.legend}>Your details</FieldLegend>
          <FieldGroup className={styles.fields}>
            <FormField
              label="Your Name"
              autoComplete="name"
              required
              maxLength={CHECKOUT_LIMITS.name}
              error={errors.name?.message}
              {...form.register("name")}
            />
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              maxLength={CHECKOUT_LIMITS.email}
              error={errors.email?.message}
              {...form.register("email")}
            />
            <FormField
              label="Phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              maxLength={CHECKOUT_LIMITS.phone}
              description="A Pakistani number the courier can call."
              error={errors.phone?.message}
              {...form.register("phone")}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet className={styles.addressSet}>
          <FieldLegend className={styles.legend}>Delivery address</FieldLegend>
          <FieldGroup className={styles.fields}>
            <FormField
              label="Shipping Name"
              autoComplete="shipping name"
              maxLength={CHECKOUT_LIMITS.name}
              description="Leave blank to deliver to your own name."
              error={errors.recipientName?.message}
              {...form.register("recipientName")}
            />
            <FormField
              label="Street Address"
              autoComplete="shipping address-line1"
              required
              maxLength={CHECKOUT_LIMITS.addressLine}
              error={errors.addressLine1?.message}
              {...form.register("addressLine1")}
            />
            <FormField
              label="Apartment, Floor or Landmark (optional)"
              autoComplete="shipping address-line2"
              maxLength={CHECKOUT_LIMITS.addressLine}
              error={errors.addressLine2?.message}
              {...form.register("addressLine2")}
            />
            <FormField
              label="City"
              autoComplete="shipping address-level2"
              required
              maxLength={CHECKOUT_LIMITS.city}
              error={errors.city?.message}
              {...form.register("city")}
            />
            <FormField
              label="Province"
              autoComplete="shipping address-level1"
              required
              maxLength={CHECKOUT_LIMITS.region}
              description="For example Punjab, Sindh, or Islamabad Capital Territory."
              error={errors.region?.message}
              {...form.register("region")}
            />
            <FormField
              label="Postal Code (optional)"
              autoComplete="shipping postal-code"
              inputMode="numeric"
              maxLength={5}
              error={errors.postalCode?.message}
              {...form.register("postalCode")}
            />
            {/* Fixed: the shop delivers within Pakistan only. */}
            <FormField
              label="Country"
              name="country"
              value={DELIVERY_COUNTRY_NAME}
              readOnly
              description="We deliver within Pakistan only."
            />
          </FieldGroup>
        </FieldSet>

        <Button type="submit" className={styles.submit} disabled={isSubmitting}>
          Save and Continue
        </Button>
        <div className={styles.footer}>
          <Link href={routes.checkout}>Back</Link>
        </div>
      </form>
    </section>
  )
}
