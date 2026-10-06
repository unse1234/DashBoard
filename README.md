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
| `/dashboard/products` | Product management list                   |
| `/dashboard/products/new` | Add a product                         |
| `/dashboard/products/[productId]` | Product details               |
| `/dashboard/products/[productId]/edit` | Edit a product           |
| `/dashboard/customers` | Customer list                        |
| `/dashboard/customers/[customerId]` | Customer details        |
| `/dashboard/imports` | Product CSV import center              |
| `/dashboard/imports/[jobId]` | Import job details              |

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
│           ├── users/       # list and [userId] details
│           ├── products/    # list, new, [productId] details and edit
│           ├── customers/   # list and [customerId] details
│           └── imports/     # import center and [jobId] details
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # auth shell, forms and form primitives
│   ├── dashboard/           # sidebar, header and overview widgets
│   ├── users/               # user management table, dialogs and details
│   ├── products/            # product list, form and details
│   ├── customers/           # customer list, details, addresses and recent orders
│   ├── imports/             # CSV upload, import job list and job details
│   └── shared/              # app-wide components (e.g. the logo)
├── hooks/
└── lib/
    ├── app.constants.ts
    ├── routes.ts
    ├── pagination.ts
    ├── sort.ts
    ├── format-date.ts
    ├── format-number.ts
    ├── format-duration.ts
    ├── format-file-size.ts
    ├── auth/                # form state types and validation
    ├── users/               # user types, zod schemas and mock data
    ├── products/            # product types, zod schema and mock data
    ├── customers/           # customer types, query helper and mock data
    └── imports/             # import job types, file validation and mock data
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

## Product management

The products module is UI-only and runs on mock data (`src/lib/products/product.mock-data.ts`).
It follows the users module: search, the category and status filters and pagination are
controlled by one `ProductsQuery` held in `ProductsList`, and they do not change the rows yet.
To connect an API, send that query (or write it to the URL) and pass the returned `products`
and `totalRecords` back in. Row selection is local to the list; Export and Delete in the bulk
actions bar are not connected.

A product's `status` is what an admin sets (`active` or `inactive`). "Out of Stock" is derived
from `stock` by `getProductDisplayStatus`, so the two can't contradict each other; an inactive
product shows as Inactive whatever its stock.

Create and edit share `ProductForm`, which uses react-hook-form with `productFormSchema`.
The amount fields are typed as text and the schema converts them to numbers, so
`ProductFormValues` (the schema's output) is shaped like a product. `ProductForm` accepts an
optional `onSubmit`; until one is passed, a valid submission only shows a "Nothing was saved"
notice. The history on the details page and the Analytics tab placeholder are mock-only.

## Product imports

The imports module is UI-only and runs on mock data (`src/lib/imports/import.mock-data.ts`). It
only handles product CSV files.

`ImportUpload` lets an admin pick a file or drop one on the box, and checks it against
`validateImportFile` (a `.csv` name, at most 10 MB; dropping several files is refused). The chosen
`File` stays in that component's state: nothing is uploaded or read. The job list is split into
Processing, Queued, Completed and Failed tabs by `groupImportsByStatus`, and
`/dashboard/imports/[jobId]` shows one job with its progress, failed rows, job information and
timeline. Progress and duration are derived from the job's row counts and timestamps
(`getImportProgress`, `getImportDurationSeconds`), and `ImportProgress` only displays the 0 to 100
value it is given. A failed job is one that finished with rows that could not be imported.

To connect an API, pass the jobs and, for the details page, the failed rows in place of the mock
data; the job list only needs `sampleErrors` per job. Every action that needs the backend (Cancel,
Retry, Error Report, the downloads, Export Errors, Retry Failed, the CSV template and the Import
button next to the file picker, which is only enabled once a valid file is chosen) is an
`ImportActionButton`. Without an `onAction` it shows a "Not available yet" notice instead of
pretending to work. To start an import, give the Import button in `ImportUpload` the upload call;
the chosen file is already in that component's state.

## Customer management

The customers module is UI-only and runs on mock data (`src/lib/customers/customer.mock-data.ts`,
and the latest orders in `customer-order.mock-data.ts`). Customers can be viewed, found and
enabled or disabled; there is no creating, editing or deleting.

Unlike users and products, the list is handed every customer and `CustomersList` runs
`queryCustomers` (`customer.query.ts`) over them, so search (ID, name, email and phone, whatever the
phone's formatting), the status filter, sorting and pagination work today. They are still driven by
one `CustomersQuery` that maps to API or URL params. To connect an API, send that query and pass the
returned `customers` and `totalRecords` in place of the `queryCustomers` call. The sort cycle and the
sortable header are shared with users (`lib/sort.ts`, `components/shared/sortable-table-head.tsx`).

Enable / Disable, in the row menu and in the details header, only changes the component's own state
and says so in a toast. It is lost on reload, and the list and the details page don't share it. To
connect the API, turn `changeStatus` in `CustomersList` and `toggleStatus` in `CustomerDetailsHeader`
into the request. The status is shown once on the details page, in the header beside that button, so
it can't disagree with it.

A customer's `totalOrders`, `totalSpent` and `lastOrderAt` come with the customer, as the API will
report them, and are not worked out from the orders on the details page. Those are a
`CustomerOrderSummary`, the few fields the page needs, for the latest `RECENT_ORDERS_LIMIT` orders;
the Orders module can replace it with its own order type. Order IDs are plain text until there is an
order details route to link to. Cancelled orders count towards `totalOrders` but not `totalSpent`,
and a test (`customer.mock-data.test.ts`) keeps each customer's summary in step with their listed
orders. Addresses are read-only, grouped as shipping and billing.

The Phone column only shows when the table is wide enough for it (a container query in
`CustomersTable`), so the table fits common laptop screens without scrolling sideways.
