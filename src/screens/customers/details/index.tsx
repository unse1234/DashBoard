import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import type {
  Customer,
  CustomerAddress,
  CustomerOrderSummary,
} from "@/lib/customers/customer.types"
import { routes } from "@/lib/routes"
import { CustomerAddresses } from "@/screens/customers/details/components/customer-addresses"
import { CustomerDetailsHeader } from "@/screens/customers/details/components/customer-details-header"
import { CustomerInformation } from "@/screens/customers/details/components/customer-information"
import { CustomerRecentOrders } from "@/screens/customers/details/components/customer-recent-orders"
import { CustomerSummary } from "@/screens/customers/details/components/customer-summary"

type CustomerDetailsScreenProps = {
  customer: Customer
  recentOrders: CustomerOrderSummary[]
  addresses: CustomerAddress[]
}

export function CustomerDetailsScreen({
  customer,
  recentOrders,
  addresses,
}: CustomerDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Customer details" />
      <PageContent>
        <BackLink href={routes.customers}>Back to Customers</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <CustomerDetailsHeader customer={customer} />
          <CustomerSummary customer={customer} />
          <div className="grid items-start gap-4 @3xl:grid-cols-[20rem_minmax(0,1fr)]">
            <CustomerInformation customer={customer} />
            <div className="flex min-w-0 flex-col gap-4">
              <CustomerRecentOrders
                orders={recentOrders}
                totalOrders={customer.totalOrders}
              />
              <CustomerAddresses addresses={addresses} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
