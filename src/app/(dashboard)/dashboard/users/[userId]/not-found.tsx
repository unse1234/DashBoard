import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BackToUsersLink } from "@/components/users/back-to-users-link"

export default function UserNotFound() {
  return (
    <>
      <DashboardHeader title="User details" />
      <div className="flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <BackToUsersLink />
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">User not found</h2>
          <p className="text-sm text-muted-foreground">
            There is no user with this UID. It may have been removed, or the
            link may be incorrect.
          </p>
        </div>
      </div>
    </>
  )
}
