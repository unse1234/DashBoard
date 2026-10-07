import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Order, OrderAddress } from "@/lib/orders/order.types"
import { getOrderAddressLines } from "@/lib/orders/order.utils"

type OrderAddressesProps = {
  order: Pick<Order, "shippingAddress" | "billingAddress">
}

export function OrderAddresses({ order }: OrderAddressesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Addresses</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container">
        <div className="grid gap-x-6 gap-y-5 @lg:grid-cols-2">
          <AddressGroup label="Shipping address" address={order.shippingAddress} />
          <AddressGroup label="Billing address" address={order.billingAddress} />
        </div>
      </CardContent>
    </Card>
  )
}

type AddressGroupProps = {
  label: string
  address: OrderAddress
}

function AddressGroup({ label, address }: AddressGroupProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="text-sm text-muted-foreground">{label}</h4>
      <address className="flex flex-col gap-0.5 text-sm not-italic wrap-anywhere">
        <span className="font-medium">{address.recipientName}</span>
        {address.phone && (
          <span className="text-muted-foreground">{address.phone}</span>
        )}
        {getOrderAddressLines(address).map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </address>
    </div>
  )
}
