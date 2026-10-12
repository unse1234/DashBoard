import { renderToString } from "react-dom/server"
import { vi } from "vitest"

import RootLayout from "@/app/layout"

// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}))
vi.mock("@/providers/session-restorer", () => ({
  SessionRestorer: () => null,
}))

describe("RootLayout", () => {
  it("provides the toast region for every route, not only the dashboard", () => {
    // A toast fired while leaving the dashboard (a failed logout reports "your
    // session may still be active" after the sidebar is gone) needs a toaster
    // that outlives the dashboard layout.
    const html = renderToString(
      <RootLayout params={Promise.resolve({})}>
        <p>page content</p>
      </RootLayout>
    )

    expect(html).toContain("page content")
    expect(html.match(/aria-label="Notifications/g)).toHaveLength(1)
  })
})
