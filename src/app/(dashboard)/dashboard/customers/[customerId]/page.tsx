import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getMockCustomerAddresses,
  getMockCustomerById,
} from "@/lib/customers/customer.mock-data"
import { getMockCustomerRecentOrders } from "@/lib/customers/customer-order.mock-data"
import { CustomerDetailsScreen } from "@/screens/customers/details"

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
    <CustomerDetailsScreen
      customer={customer}
      recentOrders={getMockCustomerRecentOrders(customer.id)}
      addresses={getMockCustomerAddresses(customer.id)}
    />
  )
}
