@AGENTS.md
# Project Instructions

## Project Overview

This project is a production-quality web application UI.

Current development priority:

1. Authentication screens
   - Login
   - Register
   - Forgot Password
   - Reset Password
2. Dashboard layout
3. Dashboard pages and features

For now, focus primarily on UI implementation unless explicitly instructed otherwise.

---

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Do not introduce alternative UI frameworks or styling systems unless explicitly requested.

---

## Core Development Principles

All code must be:

- Clean
- Maintainable
- Scalable
- Reusable
- Properly typed
- Responsive
- Accessible
- Production-quality

Avoid overengineering.

Prefer simple, well-structured solutions over unnecessary abstractions.

---

## Next.js

Follow modern Next.js conventions.

Use the App Router architecture.

Prefer Server Components by default.

Only add `"use client"` when client-side behavior actually requires it, such as:

- Form interaction
- React state
- Effects
- Browser APIs
- Interactive UI components

Do not convert entire pages or layouts into Client Components unnecessarily.

Keep routing, layouts, loading states, and component boundaries clean.

---

## TypeScript

TypeScript must be used properly.

Rules:

- Avoid `any`.
- Define meaningful interfaces/types when needed.
- Type component props.
- Keep types close to their domain when practical.
- Avoid unnecessary or overly complex generic types.
- Reuse shared types instead of duplicating them.

Do not suppress TypeScript errors without a valid reason.

---

## Tailwind CSS

Use Tailwind CSS for styling.

Rules:

- Avoid custom CSS unless Tailwind cannot reasonably handle the requirement.
- Do not create unnecessary CSS files.
- Avoid excessive arbitrary values when reusable design tokens/utilities are more appropriate.
- Keep spacing, typography, border radius, and sizing consistent.
- Maintain responsive behavior across screen sizes.
- Avoid duplicated long class strings where reusable components or utilities would be cleaner.

Do not change the global design system without a clear reason.

---

## shadcn/ui

Use shadcn/ui as the primary component foundation.

Prefer existing shadcn components before creating equivalents manually.

Examples:

- Button
- Input
- Label
- Card
- Checkbox
- Dialog
- Dropdown Menu
- Select
- Tabs
- Sheet
- Sidebar
- Tooltip
- Alert
- Separator
- Form-related components

Customize shadcn components through Tailwind and the existing design system rather than replacing them unnecessarily.

Do not add every shadcn component preemptively.

Only install components that are actually needed.

---

## Component Architecture

Prefer reusable components.

Example structure:

```text
components/
├── ui/
├── auth/
├── dashboard/
├── layout/
└── shared/
```

Avoid:

- Extremely large components
- Repeated markup
- One component for every tiny element
- Premature abstraction

Extract components when they:

- Are reused
- Represent a meaningful UI unit
- Improve readability
- Simplify maintenance

---

## Authentication UI

The authentication flow includes:

```text
/auth
├── login
├── register
├── forgot-password
└── reset-password
```

Pages may instead use route groups such as:

```text
app/
└── (auth)/
    ├── login/
    ├── register/
    ├── forgot-password/
    └── reset-password/
```

Prefer a shared auth layout.

Potential reusable components:

```text
components/auth/
├── auth-layout.tsx
├── auth-card.tsx
├── login-form.tsx
├── register-form.tsx
├── forgot-password-form.tsx
└── reset-password-form.tsx
```

Do not duplicate the same shell, branding, spacing, or layout across authentication pages.

---

## Authentication Design Consistency

Login, Register, Forgot Password, and Reset Password must feel like parts of the same product.

Keep consistent:

- Page background
- Auth container width
- Typography
- Form spacing
- Input heights
- Button heights
- Border radius
- Colors
- Error states
- Focus states
- Logo/branding placement
- Responsive behavior

Do not independently redesign each authentication page.

---

## Forms

Build forms so that backend integration can be added cleanly later.

Forms should support:

- Validation messages
- Error states
- Disabled states
- Loading states
- Success states where relevant

Use accessible labels.

Do not use placeholders as replacements for labels when labels are needed.

Do not implement mock backend behavior unless explicitly requested.

If form validation libraries already exist in the project, use them consistently.

Do not introduce additional form libraries without a reason.

---

## Responsive Design

Every screen must work properly on:

- Mobile
- Tablet
- Laptop
- Desktop

Avoid building desktop-only layouts and fixing mobile afterward.

Check:

- Overflow
- Long text
- Input widths
- Button widths
- Navigation behavior
- Vertical spacing
- Small screen heights

---

## Accessibility

Use semantic HTML.

Ensure:

- Inputs have labels
- Buttons have meaningful text or accessible labels
- Keyboard navigation works
- Focus states remain visible
- Contrast remains readable
- Interactive elements use appropriate HTML elements

Do not use clickable `<div>` elements when a button or link is appropriate.

---

## UI Quality

The interface should feel intentionally designed.

Avoid common AI-generated UI patterns such as:

- Unnecessary gradients
- Excessive glassmorphism
- Random shadows
- Excessive rounded cards
- Unnecessary icons
- Decorative elements without purpose
- Random animations
- Generic dashboard bento grids
- Excessive visual noise

Prioritize:

- Strong typography
- Clear hierarchy
- Consistent spacing
- Good alignment
- Purposeful visual structure
- Subtle interactions
- Professional polish

---

## Icons

If the project already uses an icon library, continue using it.

Do not introduce multiple icon libraries.

Keep icon:

- Size
- Stroke width
- Alignment
- Visual weight

consistent throughout the application.

---

## Dashboard

Do not start dashboard implementation until explicitly instructed.

When dashboard development begins, establish reusable architecture first.

Likely structure:

```text
app/
└── (dashboard)/
    ├── layout.tsx
    └── dashboard/
        └── page.tsx
```

Reusable dashboard components may include:

```text
components/dashboard/
├── app-sidebar.tsx
├── dashboard-header.tsx
├── mobile-navigation.tsx
└── ...
```

The dashboard shell should not be duplicated across individual dashboard pages.

---

## File Organization

Keep files near the feature they belong to.

Use understandable names.

Good:

```text
login-form.tsx
auth-card.tsx
dashboard-sidebar.tsx
```

Avoid vague names such as:

```text
component1.tsx
form2.tsx
new-component.tsx
test.tsx
```

---

## Imports

Keep imports clean and consistent.

Use project path aliases when configured.

Prefer:

```ts
import { Button } from "@/components/ui/button"
```

instead of deeply nested relative paths where possible.

---

## Dependencies

Do not install packages unnecessarily.

Before adding a package:

1. Check whether the project already has a solution.
2. Check whether Next.js, React, Tailwind, or shadcn can handle it.
3. Only install the dependency when it provides meaningful value.

Never replace existing project dependencies casually.

---

## Existing Code

Before making changes:

1. Inspect the relevant existing files.
2. Understand existing patterns.
3. Reuse existing components when appropriate.
4. Preserve working behavior.
5. Avoid unrelated modifications.

Do not rewrite functioning parts of the project merely because another implementation is possible.

---

## Visual References

When a screenshot, Figma design, or visual reference is provided:

- Treat it as the primary visual source of truth.
- Match layout, proportions, spacing, typography, borders, sizing, and alignment closely.
- Do not improvise unnecessary elements.
- Do not redesign the reference unless explicitly asked.
- Reuse existing project components where doing so does not compromise visual accuracy.

---

## Scope Discipline

Only work on what was requested.

Do not:

- Build future pages prematurely.
- Add backend functionality unless requested.
- Redesign unrelated sections.
- Introduce new libraries without need.
- Refactor unrelated working code.
- Add speculative features.

If implementing Login, implement Login—not the entire authentication system.

---

## Before Completing a Task

Check:

- TypeScript errors
- Broken imports
- Responsive layout
- Reusability
- Accessibility
- Visual consistency
- Unnecessary duplication
- Client/server component boundaries
- Existing project conventions

When practical, run the relevant lint/type/build checks before considering the task complete.

---

## Git

Keep changes logically scoped.

Prefer small, meaningful commits rather than one massive commit.

Example commit messages:

```text
feat(auth): add login page UI
feat(auth): add registration form
feat(auth): add forgot password screen
feat(auth): add reset password screen
feat(dashboard): add dashboard shell
refactor(auth): extract shared auth layout
```

Do not include unrelated changes in the same commit.

---

## Current Priority

The current implementation order is:

```text
Login
   ↓
Register
   ↓
Forgot Password
   ↓
Reset Password
   ↓
Dashboard shell
   ↓
Dashboard features
```

Do not move to the next major stage unless explicitly instructed.