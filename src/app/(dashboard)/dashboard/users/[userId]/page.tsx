import type { Metadata } from "next"

import { UserDetailsScreen } from "@/screens/users/details"

// The user is loaded in the browser (the API needs the signed-in token), so
// the title cannot include their name.
export const metadata: Metadata = {
  title: "User details",
}

export default async function UserDetailsPage({
  params,
}: PageProps<"/dashboard/users/[userId]">) {
  const { userId } = await params

  return <UserDetailsScreen userId={userId} />
}
