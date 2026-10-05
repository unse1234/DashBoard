import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { UsersList } from "@/components/users/users-list"
import { mockTotalUsers, mockUsers } from "@/lib/users/user.mock-data"

export const metadata: Metadata = {
  title: "Users",
}

export default function UsersPage() {
  return (
    <>
      <DashboardHeader title="Users" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Manage the people who can access the dashboard.
          </p>
          <CreateUserDialog />
        </div>
        <UsersList users={mockUsers} totalRecords={mockTotalUsers} />
      </div>
    </>
  )
}
