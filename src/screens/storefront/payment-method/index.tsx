"use client"

import Link from "next/link"
import { BanknoteIcon, CheckIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/config/routes"
import { cn } from "@/utils/cn"

import styles from "./payment-method.module.css"

/**
 * The shop takes cash on delivery and nothing else, so there is nothing to
 * enter: this screen says how paying works. It is a selection that is already
 * made (one option, checked), kept as a screen so the checkout's "Change" link
 * for the payment method has somewhere to go.
 */
export function PaymentMethodScreen() {
  return (
    <section className={styles.page} aria-labelledby="payment-method-heading">
      <div className={styles.panel}>
        <h1 id="payment-method-heading" className={styles.heading}>
          Payment method
        </h1>

        <div
          role="radiogroup"
          aria-labelledby="payment-method-heading"
          className={styles.options}
        >
          <div
            role="radio"
            aria-checked="true"
            aria-describedby="cod-description"
            tabIndex={0}
            className={styles.option}
          >
            <BanknoteIcon aria-hidden="true" className={styles.optionIcon} />
            <span className={styles.optionName}>Cash on delivery</span>
            <CheckIcon aria-hidden="true" className={styles.check} />
          </div>
        </div>

        <p id="cod-description" className={styles.explanation}>
          You pay in cash when your order arrives. Nothing is charged online, so
          there is no card to enter and no payment to make now.
        </p>
        <p className={styles.explanation}>
          Your order is placed as soon as you confirm it, and it is paid for
          when it is delivered.
        </p>

        <Link
          href={routes.checkout}
          className={cn(buttonVariants(), styles.submit)}
        >
          Continue
        </Link>
        <div className={styles.footer}>
          <Link href={routes.checkout}>Back</Link>
        </div>
      </div>
    </section>
  )
}
