import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import type { User } from "@/lib/users/user.types"
import { BackToUsersLink } from "@/screens/users/details/components/back-to-users-link"
import { UserDetailsCard } from "@/screens/users/details/components/user-details-card"

type UserDetailsScreenProps = {
  user: User
}

export function UserDetailsScreen({ user }: UserDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="User details" />
      <div className="flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <BackToUsersLink />
        <UserDetailsCard user={user} />
      </div>
    </>
  )
}
