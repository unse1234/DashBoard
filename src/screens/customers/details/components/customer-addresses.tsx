import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CUSTOMER_ADDRESS_GROUPS } from "@/constants/customer.constants"
import type {
  CustomerAddress,
  CustomerOrderAddress,
} from "@/types/customer.types"
import { getAddressLines } from "@/utils/customer.utils"
import { formatDate } from "@/utils/format-date"
import { formatInteger } from "@/utils/format-number"

type CustomerAddressesProps = {
  /** What the customer saved. */
  addresses: CustomerAddress[]
  /**
   * Where their orders were delivered. A guest checkout saves no address on the
   * customer, so for a shopper who only ever bought as a guest this is all there
   * is.
   */
  orderAddresses: CustomerOrderAddress[]
}

export function CustomerAddresses({
  addresses,
  orderAddresses,
}: CustomerAddressesProps) {
  const hasSaved = addresses.length > 0
  const hasOrderAddresses = orderAddresses.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Addresses</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container flex flex-col gap-6">
        {hasSaved ? (
          <div className="grid gap-x-6 gap-y-5 @lg:grid-cols-2">
            {CUSTOMER_ADDRESS_GROUPS.map(({ type, label }) => (
              <AddressGroup
                key={type}
                label={label}
                addresses={addresses.filter((address) => address.type === type)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No addresses are saved for this customer.
            {hasOrderAddresses &&
              " These are the addresses their orders were delivered to."}
          </p>
        )}

        {hasOrderAddresses && (
          <OrderAddresses
            orderAddresses={orderAddresses}
            // Under saved addresses it is a second list, so it is set apart.
            setApart={hasSaved}
          />
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

type OrderAddressesProps = {
  orderAddresses: CustomerOrderAddress[]
  setApart: boolean
}

function OrderAddresses({ orderAddresses, setApart }: OrderAddressesProps) {
  return (
    <div
      className={
        setApart
          ? "flex min-w-0 flex-col gap-2 border-t pt-5"
          : "flex min-w-0 flex-col gap-2"
      }
    >
      <h4 className="text-sm text-muted-foreground">Delivered to on orders</h4>
      <ul className="grid gap-x-6 gap-y-4 @lg:grid-cols-2">
        {orderAddresses.map(({ address, lastUsedAt, orderCount }, index) => (
          <li key={index} className="min-w-0">
            <address className="flex flex-col gap-0.5 text-sm not-italic wrap-anywhere">
              <span className="font-medium">{address.recipientName}</span>
              {address.phone && (
                <span className="text-muted-foreground">{address.phone}</span>
              )}
              {getAddressLines(address).map((line, lineIndex) => (
                <span key={lineIndex}>{line}</span>
              ))}
              <span className="text-muted-foreground">
                {orderCount === 1
                  ? "1 order"
                  : `${formatInteger(orderCount)} orders`}
                , last on{" "}
                <time dateTime={lastUsedAt}>{formatDate(lastUsedAt)}</time>
              </span>
            </address>
          </li>
        ))}
      </ul>
    </div>
  )
}
