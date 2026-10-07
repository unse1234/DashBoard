import type { Metadata } from "next"

import { mockTotalUsers, mockUsers } from "@/lib/users/user.mock-data"
import { UsersScreen } from "@/screens/users"

export const metadata: Metadata = {
  title: "Users",
}

export default function UsersPage() {
  return <UsersScreen users={mockUsers} totalRecords={mockTotalUsers} />
}
