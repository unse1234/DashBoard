import Link from "next/link"

import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderCustomer } from "@/lib/orders/order.types"
import { getCustomerRoute } from "@/lib/routes"

type OrderCustomerInformationProps = {
  customer: OrderCustomer
}

// The details shown are the order's own snapshot of the customer. Only the
// name links on, to the customer's current page.
export function OrderCustomerInformation({
  customer,
}: OrderCustomerInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Customer</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          <DetailItem label="Name">
            <Link
              href={getCustomerRoute(customer.id)}
              className="underline-offset-4 hover:underline"
            >
              {customer.name}
            </Link>
          </DetailItem>
          <DetailItem label="Customer ID">
            <span className="font-mono text-xs">{customer.id}</span>
          </DetailItem>
          <DetailItem label="Email">{customer.email}</DetailItem>
          <DetailItem label="Phone">
            {customer.phone ?? (
              <span className="text-muted-foreground">Not provided</span>
            )}
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
