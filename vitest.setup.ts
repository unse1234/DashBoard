import { createElement, type ComponentProps } from "react"
import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// next/link needs the app router; a plain anchor is enough for these tests.
vi.mock("next/link", () => ({
  default: ({ href, ...props }: ComponentProps<"a"> & { href: string }) =>
    createElement("a", { href, ...props }),
}))
