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
| `/dashboard/users` | User management list                         |
| `/dashboard/users/[userId]` | User details                        |

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
│           └── users/       # list and [userId] details
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # auth shell, forms and form primitives
│   ├── dashboard/           # sidebar, header and overview widgets
│   ├── users/               # user management table, dialogs and details
│   └── shared/              # app-wide components (e.g. the logo)
├── hooks/
└── lib/
    ├── app.constants.ts
    ├── routes.ts
    ├── pagination.ts
    ├── format-date.ts
    ├── auth/                # form state types and validation
    └── users/               # user types, zod schemas and mock data
```

Auth forms are UI-only. Each accepts an optional `action` prop with the
`AuthFormAction` signature (`src/lib/auth/form-state.ts`), so a Server Action can
be passed in from the page when backend auth is added.

## User management

The users module is UI-only and runs on mock data (`src/lib/users/user.mock-data.ts`).
Search, the status filter, sorting and pagination are controlled by one `UsersQuery`
held in `UsersList`; they do not change the rows yet. To connect an API, send that query
(or write it to the URL) and pass the returned `users` and `totalRecords` back in.

The create and edit dialogs use react-hook-form with the zod schemas in
`src/lib/users/user.schemas.ts` and accept an optional `onSubmit`. Disable / Enable in the
row menu is not wired up.
