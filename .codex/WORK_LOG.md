2026-10-01 — Fixed the employee-list auth failure by removing the incorrect email-verification requirement from the HR guard and ensuring the client fetch includes cookies and redirects unauthorized users to the login page. Verified with `npx tsc --noEmit`, `npx eslint .`, and `npm run build`; all passed successfully.

2026-10-02 — Finished employee PDF export by wiring it to the employee table only, reporting export errors, and deferring `html2pdf.js` loading to avoid SSR browser-global failures. Verified with targeted ESLint and `npm run build`.

2026-10-02 — Restored the table export button's download icon and Thai label using the existing bordered-button style. Normalized modern CSS colors in the PDF clone to RGBA before canvas rendering, preserving alpha. Verified with targeted ESLint, TypeScript, production build, and browser canvas probes for opaque and translucent `lab()`/`oklch()` colors.
