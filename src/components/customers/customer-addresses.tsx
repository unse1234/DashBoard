import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CUSTOMER_ADDRESS_GROUPS } from "@/lib/customers/customer.constants"
import type { CustomerAddress } from "@/lib/customers/customer.types"
import { getAddressLines } from "@/lib/customers/customer.utils"

type CustomerAddressesProps = {
  addresses: CustomerAddress[]
}

export function CustomerAddresses({ addresses }: CustomerAddressesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Addresses</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container">
        {addresses.length === 0 ? (
          <p className="text-muted-foreground">
            No addresses are saved for this customer.
          </p>
        ) : (
          <div className="grid gap-x-6 gap-y-5 @lg:grid-cols-2">
            {CUSTOMER_ADDRESS_GROUPS.map(({ type, label }) => (
              <AddressGroup
                key={type}
                label={label}
                addresses={addresses.filter((address) => address.type === type)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type AddressGroupProps = {
  label: string
  addresses: CustomerAddress[]
}

function AddressGroup({ label, addresses }: AddressGroupProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="text-sm text-muted-foreground">{label}</h4>
      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">None saved</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id}>
              {/* "Default" only tells addresses apart, so it is left off when
                  there is only one. */}
              <AddressBlock
                address={address}
                showDefault={addresses.length > 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type AddressBlockProps = {
  address: CustomerAddress
  showDefault: boolean
}

function AddressBlock({ address, showDefault }: AddressBlockProps) {
  return (
    <address className="flex flex-col gap-0.5 text-sm not-italic wrap-anywhere">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
        {address.recipientName}
        {showDefault && address.isDefault && (
          <Badge variant="secondary">Default</Badge>
        )}
      </span>
      {address.phone && (
        <span className="text-muted-foreground">{address.phone}</span>
      )}
      {getAddressLines(address).map((line, index) => (
        <span key={index}>{line}</span>
      ))}
    </address>
  )
}
