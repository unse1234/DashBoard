import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/config/routes"
import { CustomerDetails } from "@/screens/customers/details/components/customer-details"

type CustomerDetailsScreenProps = {
  customerId: string
}

export function CustomerDetailsScreen({
  customerId,
}: CustomerDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Customer details" />
      <PageContent>
        <BackLink href={routes.customers}>Back to Customers</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <CustomerDetails customerId={customerId} />
        </div>
      </PageContent>
    </>
  )
}
