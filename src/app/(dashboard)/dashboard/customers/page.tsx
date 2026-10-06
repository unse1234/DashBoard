import type { Metadata } from "next"

import { CustomersList } from "@/components/customers/customers-list"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { mockCustomers } from "@/lib/customers/customer.mock-data"

export const metadata: Metadata = {
  title: "Customers",
}

export default function CustomersPage() {
  return (
    <>
      <DashboardHeader title="Customers" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review your customers and what they have ordered.{" "}
          {mockCustomers.length} customers in total.
        </p>
        <CustomersList customers={mockCustomers} />
      </PageContent>
    </>
  )
}
