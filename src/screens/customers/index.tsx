import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { CustomersList } from "@/screens/customers/components/customers-list"
import { CustomersTotal } from "@/screens/customers/components/customers-total"

export function CustomersScreen() {
  return (
    <>
      <DashboardHeader title="Customers" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review your customers and what they have ordered. <CustomersTotal />
        </p>
        <CustomersList />
      </PageContent>
    </>
  )
}
