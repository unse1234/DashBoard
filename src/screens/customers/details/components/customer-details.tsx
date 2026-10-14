"use client"

import { LoadError } from "@/components/shared/load-error"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api/api-error"
import { useCustomerDetailsQuery } from "@/hooks/customers/customer.queries"
import { CustomerAddresses } from "@/screens/customers/details/components/customer-addresses"
import { CustomerDetailsHeader } from "@/screens/customers/details/components/customer-details-header"
import { CustomerInformation } from "@/screens/customers/details/components/customer-information"
import { CustomerNotFound } from "@/screens/customers/details/components/customer-not-found"
import { CustomerRecentOrders } from "@/screens/customers/details/components/customer-recent-orders"
import { CustomerSummary } from "@/screens/customers/details/components/customer-summary"

const SUMMARY_STAT_COUNT = 3

type CustomerDetailsProps = {
  customerId: string
}

/** Loads one customer and renders the matching state: loading, missing, failed or ready. */
export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const { data, error, refetch } = useCustomerDetailsQuery(customerId)

  if (error) {
    // The API answers 404 for unknown ids and 400 for ids not shaped like "CUS-1001".
    if (isApiError(error) && (error.status === 404 || error.status === 400)) {
      return <CustomerNotFound />
    }
    return (
      <LoadError
        resourceName="this customer"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data) return <CustomerDetailsSkeleton />

  const { customer, addresses, orderAddresses, recentOrders } = data
  return (
    <>
      <CustomerDetailsHeader customer={customer} />
      <CustomerSummary customer={customer} />
      <div className="grid items-start gap-4 @3xl:grid-cols-[20rem_minmax(0,1fr)]">
        <CustomerInformation customer={customer} />
        <div className="flex min-w-0 flex-col gap-4">
          <CustomerRecentOrders
            orders={recentOrders}
            totalOrders={customer.totalOrders}
          />
          <CustomerAddresses
            addresses={addresses}
            orderAddresses={orderAddresses}
          />
        </div>
      </div>
    </>
  )
}

/** The page's outline (header, summary, two columns of cards) while it loads. */
function CustomerDetailsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid gap-4 @xl:grid-cols-3">
        {Array.from({ length: SUMMARY_STAT_COUNT }, (_, index) => (
          <Card key={index} className="gap-2 px-(--card-spacing)">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-4 @3xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
