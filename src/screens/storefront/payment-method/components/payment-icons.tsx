import type { ComponentProps } from "react"

export function DemoCardIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path fillRule="evenodd" d="M4 4h16a2 2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2Zm-2 7h20v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Zm4 3v3h4v-3Z" />
    </svg>
  )
}

export function DemoExpiryIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M7 2h1v3h8V2h1v3h3a2 2 0 0 1 2 2v2H2V7a2 2 0 0 1 2-2h3ZM2 11h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
      <text x="12" y="19" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700">31</text>
    </svg>
  )
}
