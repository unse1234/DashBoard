import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BackToUsersLink } from "@/components/users/back-to-users-link"
import { UserDetailsCard } from "@/components/users/user-details-card"
import { getMockUserByUid } from "@/lib/users/user.mock-data"

type UserDetailsPageProps = PageProps<"/dashboard/users/[userId]">

export async function generateMetadata({
  params,
}: UserDetailsPageProps): Promise<Metadata> {
  const { userId } = await params

  return { title: getMockUserByUid(userId)?.name ?? "User not found" }
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const { userId } = await params
  const user = getMockUserByUid(userId)

  if (!user) notFound()

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
