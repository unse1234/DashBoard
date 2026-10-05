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
| `/`                | Redirects to `/login`                        |
| `/login`           | Log in                                       |
| `/register`        | Create an account                            |
| `/forgot-password` | Request a password reset link                |
| `/reset-password`  | Set a new password                           |
| `/dashboard`       | Dashboard overview                           |

Paths are defined once in `src/lib/routes.ts`. `typedRoutes` is enabled, so links to routes that don't exist fail type-checking.

## Structure

```text
src/
├── app/
│   ├── layout.tsx           # root layout, fonts, title template
│   ├── page.tsx             # "/" → redirect
│   ├── (auth)/              # route group sharing the auth layout
│   │   ├── layout.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── (dashboard)/         # route group sharing the sidebar shell
│       ├── layout.tsx
│       └── dashboard/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # auth shell, forms and form primitives
│   ├── dashboard/           # sidebar, header and overview widgets
│   └── shared/              # app-wide components (e.g. the logo)
├── hooks/
└── lib/
    ├── app.constants.ts
    ├── routes.ts
    └── auth/                # form state types and validation
```

Auth forms are UI-only. Each accepts an optional `action` prop with the
`AuthFormAction` signature (`src/lib/auth/form-state.ts`), so a Server Action can
be passed in from the page when backend auth is added.
