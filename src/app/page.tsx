import { redirect } from "next/navigation"

import { routes } from "@/lib/routes"

// The dashboard guard sends visitors without a session on to the login screen.
export default function HomePage() {
  redirect(routes.dashboard)
}
