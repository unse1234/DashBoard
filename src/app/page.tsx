import { redirect } from "next/navigation"

import { routes } from "@/lib/routes"

// There is no landing page or dashboard yet, so the app starts at login.
export default function HomePage() {
  redirect(routes.login)
}
