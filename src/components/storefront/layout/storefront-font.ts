import { Cabin } from "next/font/google"

/**
 * The storefront typeface. The storefront layout applies its variable, and the
 * menu applies it again because its popup renders in a portal outside that layout.
 */
export const storefrontFont = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
})
