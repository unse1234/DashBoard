import { AdminOnly } from "@/components/auth/admin-only"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BackToUsersLink } from "@/screens/users/details/components/back-to-users-link"
import { UserDetails } from "@/screens/users/details/components/user-details"

type UserDetailsScreenProps = {
  userId: string
}

export function UserDetailsScreen({ userId }: UserDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="User details" />
      <div className="flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <BackToUsersLink />
        <AdminOnly>
          <UserDetails userId={userId} />
        </AdminOnly>
      </div>
    </>
  )
}
