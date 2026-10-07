import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Customer } from "@/lib/customers/customer.types"
import { formatDateTime } from "@/lib/format-date"

type CustomerInformationProps = {
  customer: Customer
}

export function CustomerInformation({ customer }: CustomerInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Customer information</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container">
        <dl className="grid gap-x-6 gap-y-4 @lg:grid-cols-2">
          <DetailItem label="Full Name">{customer.name}</DetailItem>
          <DetailItem label="Customer ID">
            <span className="font-mono text-xs">{customer.id}</span>
          </DetailItem>
          <DetailItem label="Email" className="@lg:col-span-2">
            {customer.email}
          </DetailItem>
          <DetailItem label="Phone">
            {customer.phone ?? (
              <span className="text-muted-foreground">Not provided</span>
            )}
          </DetailItem>
          <DetailItem label="Joined At">
            <time dateTime={customer.joinedAt}>
              {formatDateTime(customer.joinedAt)}
            </time>
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
