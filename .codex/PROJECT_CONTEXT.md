# Project context

Last reviewed: 2026-09-22

## Template

- Next.js 16.3.5 with the App Router
- React 19.2.8 and TypeScript (strict mode)
- Tailwind CSS 4, imported from `src/app/globals.css`
- npm scripts: `npm run dev`, `npm run build`, `npm run lint`

## Current structure

```text
src/
  app/
    layout.tsx       # root document shell and global metadata
    globals.css      # global styles and Tailwind theme tokens
    page.tsx         # / route; currently empty
    favicon.ico
  types/
    application.ts   # JobApplication and ApplicationStatus types
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
