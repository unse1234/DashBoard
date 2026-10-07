import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import type { Customer } from "@/lib/customers/customer.types"
import { formatDate } from "@/lib/format-date"
import { formatCurrency, formatInteger } from "@/lib/format-number"

type CustomerSummaryProps = {
  customer: Customer
}

export function CustomerSummary({ customer }: CustomerSummaryProps) {
  return (
    <dl className="grid gap-4 @xl:grid-cols-3">
      <SummaryStat label="Total Orders">
        {formatInteger(customer.totalOrders)}
      </SummaryStat>
      <SummaryStat label="Total Spent">
        {formatCurrency(customer.totalSpent)}
      </SummaryStat>
      <SummaryStat label="Last Order">
        {customer.lastOrderAt ? (
          <time dateTime={customer.lastOrderAt}>
            {formatDate(customer.lastOrderAt)}
          </time>
        ) : (
          <span className="text-muted-foreground">No orders yet</span>
        )}
      </SummaryStat>
    </dl>
  )
}

type SummaryStatProps = {
  label: string
  children: ReactNode
}

function SummaryStat({ label, children }: SummaryStatProps) {
  return (
    <Card className="gap-1 px-(--card-spacing)">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums wrap-anywhere">
        {children}
      </dd>
    </Card>
  )
}
