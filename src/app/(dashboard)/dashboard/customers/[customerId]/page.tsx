import type { Metadata } from "next"

import { CustomerDetailsScreen } from "@/screens/customers/details"

// The customer is loaded in the browser (the API needs the signed-in token), so
// the title cannot include their name.
export const metadata: Metadata = {
  title: "Customer details",
}

export default async function CustomerDetailsPage({
  params,
}: PageProps<"/dashboard/customers/[customerId]">) {
  const { customerId } = await params

  return <CustomerDetailsScreen customerId={customerId} />
}
