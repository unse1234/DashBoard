import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CustomerAddresses } from "@/components/customers/customer-addresses"
import { CustomerDetailsHeader } from "@/components/customers/customer-details-header"
import { CustomerInformation } from "@/components/customers/customer-information"
import { CustomerRecentOrders } from "@/components/customers/customer-recent-orders"
import { CustomerSummary } from "@/components/customers/customer-summary"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import {
  getMockCustomerAddresses,
  getMockCustomerById,
} from "@/lib/customers/customer.mock-data"
import { getMockCustomerRecentOrders } from "@/lib/customers/customer-order.mock-data"
import { routes } from "@/lib/routes"

type CustomerDetailsPageProps = PageProps<"/dashboard/customers/[customerId]">

export async function generateMetadata({
  params,
}: CustomerDetailsPageProps): Promise<Metadata> {
  const { customerId } = await params

  return {
    title: getMockCustomerById(customerId)?.name ?? "Customer not found",
  }
}

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { customerId } = await params
  const customer = getMockCustomerById(customerId)

  if (!customer) notFound()

  return (
    <>
      <DashboardHeader title="Customer details" />
      <PageContent>
        <BackLink href={routes.customers}>Back to Customers</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <CustomerDetailsHeader key={customer.id} customer={customer} />
          <CustomerSummary customer={customer} />
          <div className="grid items-start gap-4 @3xl:grid-cols-[20rem_minmax(0,1fr)]">
            <CustomerInformation customer={customer} />
            <div className="flex min-w-0 flex-col gap-4">
              <CustomerRecentOrders
                orders={getMockCustomerRecentOrders(customer.id)}
                totalOrders={customer.totalOrders}
              />
              <CustomerAddresses addresses={getMockCustomerAddresses(customer.id)} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
