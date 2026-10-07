import type { Customer } from "@/lib/customers/customer.types"

type CustomerDetailsHeaderProps = {
  customer: Customer
}

export function CustomerDetailsHeader({
  customer,
}: CustomerDetailsHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h2 className="text-xl font-medium wrap-anywhere">{customer.name}</h2>
      <p className="text-muted-foreground">
        Customer ID: <span className="font-mono text-xs">{customer.id}</span>
      </p>
    </div>
  )
}
