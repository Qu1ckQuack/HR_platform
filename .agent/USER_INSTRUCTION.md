# Your instructions

Create mvp HR management system according to my requirement any question, can't debug told me it's on me

## Employee Page Refactoring Plan (2026-10-05)

### Problem

`src/components/employees/EmployeePage.tsx` is a 1,268-line monolith containing
10+ components, types, and utilities all in one file.

### Target Structure

```text
src/components/employees/
├── EmployeePage.tsx              ← Slim orchestrator (~120 lines)
├── EmployeeHeader.tsx            ← Top navigation bar
├── EmployeeToolbar.tsx           ← Title, subtitle, action buttons (import/add)
├── EmployeeStatusFilter.tsx      ← Status pill filters (all/active/probation)
├── EmployeeSearchBar.tsx         ← Search input + dropdowns + view toggle + export
├── EmployeeTable.tsx             ← Table with thead, tbody, row rendering, skeleton, error/empty
├── EmployeeTableRow.tsx          ← Single employee row with action buttons
├── EmployeeTableSkeleton.tsx     ← Loading skeleton row
├── EmployeePagination.tsx        ← Footer pagination controls
├── EmployeeEditModal.tsx         ← Create/Edit employee modal (form + submission)
├── EmployeeViewDrawer.tsx        ← Side drawer for viewing employee details
├── EmployeeHistoryModal.tsx      ← Position history modal
├── EmployeeNotificationItem.tsx  ← (already exists, keep as-is)
├── EmployeeNotifications.tsx     ← (already exists, keep as-is)
├── form/
│   ├── FormInput.tsx             ← Reusable labeled text input
│   ├── FormSelect.tsx            ← Reusable labeled select dropdown
│   └── types.ts                  ← EmployeeEditForm, EmployeeFormOptions types
└── utils/
    ├── format-contract.ts        ← formatContractDeadline
    └── format-input.ts           ← formatWithGroups, formatCitizenId, formatPhone
```

### Rules

- **Zero behavior change** — purely structural, no visual or functional differences.
- **Old UI must not change** — same styling, same layout, same interactions.
- All state management stays in `EmployeePage.tsx`; children receive props only.
- `Pill` component (status filter button) lives inside `EmployeeStatusFilter.tsx`.
- `ExportPdfButton` lives inside `src/hooks/useExportTable.tsx` and is imported as a reusable component across the project.

### Migration Order (bottom-up)

1. Extract `utils/` (pure functions, zero risk)
2. Extract `form/` components (self-contained, no state)
3. Extract leaf components: `EmployeeTableSkeleton` → `EmployeeTableRow` → `EmployeePagination`
4. Extract composed components: `EmployeeTable` → `EmployeeSearchBar` → `EmployeeStatusFilter` → `EmployeeToolbar` → `EmployeeHeader`
5. Extract modals/drawers: `EmployeeEditModal` → `EmployeeViewDrawer` → `EmployeeHistoryModal`
6. Final slim-down of `EmployeePage.tsx` to orchestrator-only


### PDF Export Implementation (`html2canvas-pro` + `jspdf`)

- Location: `src/hooks/useExportTable.tsx`
- Libraries: `html2canvas-pro` (supports modern CSS color spaces such as `lab()`, `oklch()`, `color(display-p3)`, etc.) and `jspdf`.
- Exports:
  - `ExportPdfButton` (React Component): reusable button component taking `targetRef` (`RefObject<HTMLElement | null>`), `filename?`, `label?`, `className?`, and `orientation?`.
  - `useExportTable` (Custom Hook): hook providing `{ handleExport, isExporting, exportToPDF }`.
  - `exportToPDF` (Helper function): core PDF generator using `html2canvas-pro` + `jspdf`.
- Strategy:
  1. Dynamically import `html2canvas-pro` and `jspdf` inside `exportToPDF` to prevent SSR browser-global evaluation and minimize initial client bundle size.
  2. Capture element canvas using `html2canvas-pro` with `scale: 2` (sharp high-DPI rendering) and full support for Tailwind CSS v4 color formats (`lab()`, `oklch()`).
  3. Generate multi-page or single-page PDF with `jspdf` in A4 landscape orientation with proportional scaling and margins.
  4. `ExportPdfButton` tracks `isExporting` state, disables button during export, and displays user-friendly Thai alert on error.
  5. In `EmployeeSearchBar.tsx`: cleanly consumed as `<ExportPdfButton targetRef={reportRef} filename="employees.pdf" />`.