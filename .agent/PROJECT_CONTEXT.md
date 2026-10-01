# Project context

This is employee manager web app for HR

## Template

- Next.js 16.3.5 with the App Router
- React 19.2.8 and TypeScript (strict mode)
- Tailwind CSS 4, imported from `src/app/globals.css`
- npm scripts: `npm run dev`, `npm run build`, `npm run lint`

## Current structure

```text
my-app/
│
├── app/                         # Next.js routing + pages + HTTP endpoints
│
│   ├── (auth)/                  # Route group; doesn't appear in the URL
│   │   ├── login/
│   │   │   └── page.tsx         # /login
│   │   └── register/
│   │       └── page.tsx         # /register
│   │
│   ├── dashboard/
│   │   ├── page.tsx             # /dashboard
│   │   └── loading.tsx          # Loading UI while dashboard loads
│   │
│   ├── api/                     # HTTP API endpoints
│   │   ├── users/
│   │   │   └── route.ts         # /api/users
│   │   ├── employee/
│   │   │   └── route.ts         # /api/employee
│   │   └── auth/
│   │       └── route.ts         # /api/auth
│   │
│   ├── layout.tsx               # Root layout shared by pages
│   ├── page.tsx                 # / homepage
│   └── globals.css              # Global CSS
│
├── components/                  # Reusable React UI components
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── Navbar.tsx
│   └── ProductCard.tsx
│
├── lib/                         # Infrastructure/shared utilities
│   ├── db.ts                    # Database connection
│   ├── auth.ts                  # Authentication configuration/helpers
│   └── utils.ts                 # Generic utilities
│
├── services/                    # Business/application logic
│   ├── user.service.ts
│   ├── product.service.ts
│   └── auth.service.ts
│
├── repositories/                # Database access layer
│   ├── user.repository.ts
│   └── product.repository.ts
│
├── types/                       # TypeScript types
│   ├── user.ts
│   └── product.ts
│
├── hooks/                       # React custom hooks
│   ├── useUser.ts
│   └── useProducts.ts
│
├── drizzle/                     # Database schema/migrations
│   └── schema.drizzle
│
├── public/                      # Static files served directly
│   ├── images/
│   └── icons/
│
├── middleware.ts                # Runs before matching requests
├── .env                         # Environment variables
├── package.json                 # Dependencies/scripts
├── tsconfig.json                # TypeScript configuration
└── next.config.ts               # Next.js configuration
```

## Notes for future work

- The project uses the `src/` directory as its Next.js source root; put routes
  under `src/app/`.
- The root layout currently provides Geist fonts and imports global styles.
- Page components are Server Components by default. Add `"use client"` only to
  components that need browser APIs, event handlers, or React client hooks.
- A migration from a root `app/` folder to `src/app/` is present in the working
  tree. Preserve it unless a task explicitly changes that decision.
- Read the relevant local Next.js 16 documentation in
  `node_modules/next/dist/docs/` before changing Next.js code.
- Write WORK_LOG everytime your task is complete `.agent/WORK_LOG.md`
