import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getMockUserByUid } from "@/lib/users/user.mock-data"
import { UserDetailsScreen } from "@/screens/users/details"

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

  return <UserDetailsScreen user={user} />
}
