import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import type { Customer } from "@/lib/customers/customer.types"
import { CustomersList } from "@/screens/customers/components/customers-list"

type CustomersScreenProps = {
  customers: Customer[]
  totalRecords: number
}

export function CustomersScreen({
  customers,
  totalRecords,
}: CustomersScreenProps) {
  return (
    <>
      <DashboardHeader title="Customers" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review your customers and what they have ordered. {totalRecords}{" "}
          customers in total.
        </p>
        <CustomersList customers={customers} totalRecords={totalRecords} />
      </PageContent>
    </>
  )
}
