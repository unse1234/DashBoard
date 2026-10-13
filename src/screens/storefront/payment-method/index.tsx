"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { CheckIcon, LockKeyholeIcon } from "lucide-react"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { demoCheckoutCardholderName, demoCheckoutPaymentMethods } from "@/mocks/storefront/checkout-payment-demo"
import type { MockPaymentMethodSummary } from "@/types/storefront/checkout-draft.types"
import {
  checkoutPaymentSchema,
  formatDemoCardExpiry,
  formatDemoCardNumber,
  getDemoCardBrand,
  parseDemoCardExpiry,
  type CheckoutPaymentFormValues,
} from "@/validations/storefront/checkout-payment.schema"
import { cn } from "@/utils/cn"

import { DemoCardIcon, DemoExpiryIcon } from "./components/payment-icons"
import { PaymentInputField } from "./components/payment-input-field"
import styles from "./payment-method.module.css"

const initialValues: CheckoutPaymentFormValues = {
  cardholderName: demoCheckoutCardholderName,
  cardNumber: "",
  expiry: "",
  cvc: "",
  isDefault: true,
}

export function PaymentMethodScreen() {
  const router = useRouter()
  const { draft, setPaymentMethod } = useCheckoutDraft()
  const form = useForm<CheckoutPaymentFormValues>({
    resolver: zodResolver(checkoutPaymentSchema),
    defaultValues: initialValues,
  })
  const { errors, isSubmitting } = form.formState
  const selected = draft.paymentMethod
  const methods = selected && !demoCheckoutPaymentMethods.some((method) => method.id === selected.id)
    ? [...demoCheckoutPaymentMethods, selected]
    : demoCheckoutPaymentMethods

  function submit(values: CheckoutPaymentFormValues) {
    const digits = values.cardNumber.replace(/\D/g, "")
    const brand = getDemoCardBrand(digits)
    const expiry = parseDemoCardExpiry(values.expiry)
    if (!brand || !expiry) return
    const summary: MockPaymentMethodSummary = {
      id: `demo-${crypto.randomUUID()}`,
      brand,
      last4: digits.slice(-4),
      ...expiry,
      isDefault: values.isDefault,
      isDemo: true,
    }
    setPaymentMethod(summary)
    // Erase all transient form values before leaving, including number and CVC.
    form.reset(initialValues)
    router.push(routes.checkout)
  }

  return (
    <section className={styles.page} aria-labelledby="payment-method-heading">
      <h1 id="payment-method-heading" className="sr-only">Payment method</h1>
      <div className={styles.content}>
        <section className={styles.savedPanel}>
          <FieldSet>
            <FieldLegend className={styles.heading}>SELECT A CARD</FieldLegend>
            <div className={styles.savedCards}>
              {methods.map((method) => (
                <label key={method.id} className={cn(styles.cardOption, selected?.id === method.id && styles.selectedCard)}>
                  <input type="radio" name="demo-saved-card" value={method.id} checked={selected?.id === method.id} onChange={() => setPaymentMethod(method)} />
                  <DemoCardIcon />
                  <span>{method.brand} ending in {method.last4}</span>
                  {selected?.id === method.id && <CheckIcon className={styles.selectionCheck} aria-hidden="true" />}
                </label>
              ))}
            </div>
          </FieldSet>
        </section>

        <form className={styles.newPanel} onSubmit={form.handleSubmit(submit)} noValidate aria-labelledby="new-card-heading" autoComplete="off">
          <h2 id="new-card-heading" className={styles.heading}>ADD A NEW CARD</h2>
          <FieldGroup className={styles.fields}>
            <FormField label="Cardholder Name" autoComplete="cc-name" required maxLength={120} error={errors.cardholderName?.message} {...form.register("cardholderName")} />
            <Controller name="cardNumber" control={form.control} render={({ field }) => (
              <PaymentInputField label="Card Number" icon={<DemoCardIcon />} placeholder="Card number" autoComplete="off" inputMode="numeric" required maxLength={23} error={errors.cardNumber?.message} {...field} onChange={(event) => field.onChange(formatDemoCardNumber(event.target.value))} />
            )} />
          </FieldGroup>
          <FieldGroup className={styles.cardDetails}>
            <Controller name="expiry" control={form.control} render={({ field }) => (
              <PaymentInputField label="Expiry Date" icon={<DemoExpiryIcon />} placeholder="MM / YYYY" autoComplete="cc-exp" inputMode="numeric" required maxLength={9} error={errors.expiry?.message} {...field} onChange={(event) => field.onChange(formatDemoCardExpiry(event.target.value))} />
            )} />
            <FormField label="CVC" placeholder="CVC" autoComplete="off" inputMode="numeric" required maxLength={4} error={errors.cvc?.message} {...form.register("cvc")} />
          </FieldGroup>
          <Controller name="isDefault" control={form.control} render={({ field }) => (
            <Field orientation="horizontal" className={styles.preference}>
              <Checkbox id="default-payment-method" name={field.name} ref={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
              <FieldLabel htmlFor="default-payment-method">Save this as your default payment method</FieldLabel>
            </Field>
          )} />
          <Button type="submit" className={styles.submit} disabled={isSubmitting}>
            <DemoCardIcon data-icon="inline-start" />
            Add Payment Method
          </Button>
          <div className={styles.footer}>
            <Link href={routes.checkout}>Back</Link>
            <span className={styles.lock} title="Demo checkout interface">
              <LockKeyholeIcon aria-hidden="true" />
              Secure Connection
            </span>
          </div>
        </form>
      </div>
    </section>
  )
}
