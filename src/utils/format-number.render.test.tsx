import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ProductPricing } from "@/screens/products/details/components/product-pricing"
import { OrderSummary } from "@/screens/orders/details/components/order-summary"
import { OrderPriceBreakdown } from "@/screens/orders/details/components/order-price-breakdown"
import { createProduct } from "@/test-utils/product-fixtures"
import { createOrder } from "@/test-utils/order-fixtures"

describe("recorded currencies on product and order pages", () => {
  it.each(["USD", "PKR"] as const)(
    "renders %s product pricing without changing the amount",
    (currency) => {
      render(
        <ProductPricing
          product={createProduct({ currency, price: 249, costPrice: 100 })}
        />
      )
      expect(screen.getByRole("heading", { name: "Pricing" })).toBeInTheDocument()
      expect(
        screen.getByText(currency === "USD" ? "$249.00" : "PKR 249.00")
      ).toBeInTheDocument()
    }
  )

  it.each(["USD", "PKR"] as const)(
    "renders %s order summary and breakdown without changing totals",
    (currency) => {
      const order = createOrder({ currency, total: 61.75 })
      render(
        <>
          <OrderSummary order={order} status={order.status} />
          <OrderPriceBreakdown order={order} />
        </>
      )
      const totals = screen.getAllByText("Total", { selector: "dt" })
      for (const total of totals) {
        expect(
          within(total.nextElementSibling as HTMLElement).getByText(
            currency === "USD" ? "$61.75" : "PKR 61.75"
          )
        ).toBeInTheDocument()
      }
      expect(totals).toHaveLength(2)
    }
  )
})
