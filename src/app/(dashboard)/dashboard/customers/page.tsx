import type { Metadata } from "next"

import {
  mockCustomers,
  mockTotalCustomers,
} from "@/lib/customers/customer.mock-data"
import { CustomersScreen } from "@/screens/customers"

export const metadata: Metadata = {
  title: "Customers",
}

export default function CustomersPage() {
  return (
    <CustomersScreen
      customers={mockCustomers}
      totalRecords={mockTotalCustomers}
    />
  )
}
