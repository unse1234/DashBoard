import { redirect } from "next/navigation"

import { routes } from "@/lib/routes"

// Authentication is UI-only for now, so the app starts at the login screen.
export default function HomePage() {
  redirect(routes.login)
}
