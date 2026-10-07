import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import type { User } from "@/lib/users/user.types"
import { CreateUserDialog } from "@/screens/users/components/create-user-dialog"
import { UsersList } from "@/screens/users/components/users-list"

type UsersScreenProps = {
  users: User[]
  totalRecords: number
}

export function UsersScreen({ users, totalRecords }: UsersScreenProps) {
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
        <UsersList users={users} totalRecords={totalRecords} />
      </div>
    </>
  )
}
