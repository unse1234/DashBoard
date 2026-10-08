import { AdminOnly } from "@/components/auth/admin-only"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UsersList } from "@/screens/users/components/users-list"

export function UsersScreen() {
  return (
    <>
      <DashboardHeader title="Users" />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <AdminOnly>
          <UsersList />
        </AdminOnly>
      </div>
    </>
  )
}
