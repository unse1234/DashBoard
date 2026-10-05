# Dashboard

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Vitest

## Scripts

```bash
npm run dev       # start the dev server on http://localhost:3000
npm run build     # production build (also type-checks)
npm run lint      # ESLint
npm run test      # Vitest in watch mode (test:run for a single run)
```

## Routes

| Path               | Description                                  |
| ------------------ | -------------------------------------------- |
| `/`                | Redirects to `/login` (no dashboard yet)     |
| `/login`           | Log in                                       |
| `/register`        | Create an account                            |
| `/forgot-password` | Request a password reset link                |
| `/reset-password`  | Set a new password                           |

Paths are defined once in `src/lib/routes.ts`. `typedRoutes` is enabled, so links to routes that don't exist fail type-checking.

## Structure

```text
src/
├── app/
│   ├── layout.tsx           # root layout, fonts, title template
│   ├── page.tsx             # "/" → redirect
│   └── (auth)/              # route group sharing the auth layout
│       ├── layout.tsx
│       ├── login/
│       ├── register/
│       ├── forgot-password/
│       └── reset-password/
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── auth/                # auth shell, forms and form primitives
└── lib/
    ├── routes.ts
    └── auth/                # form state types and validation
```

Auth forms are UI-only. Each accepts an optional `action` prop with the
`AuthFormAction` signature (`src/lib/auth/form-state.ts`), so a Server Action can
be passed in from the page when backend auth is added.
